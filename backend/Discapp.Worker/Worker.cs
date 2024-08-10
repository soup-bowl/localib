using Discapp.Shared.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Net.Http.Json;

namespace Discapp.Worker;

public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly DiscogsOptions _discogsOptions;
    private readonly PathSettings _pathOptions;
    private readonly HttpClient _httpClient;

    public Worker(ILogger<Worker> logger, IServiceScopeFactory scopeFactory, IOptions<DiscogsOptions> discogsOptions, IOptions<PathSettings> pathOptions)
    {
        _logger = logger;
        _scopeFactory = scopeFactory;
        _discogsOptions = discogsOptions.Value;
        _pathOptions = pathOptions.Value;
        _httpClient = new HttpClient
        {
            BaseAddress = new Uri("https://api.discogs.com/")
        };
        _httpClient.DefaultRequestHeaders.Add("User-Agent", "DiscappWorker/1.0");
        _httpClient.DefaultRequestHeaders.Add("Authorization", $"Discogs key={_discogsOptions.ConsumerKey}, secret={_discogsOptions.ConsumerSecret}");
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            if (_logger.IsEnabled(LogLevel.Information))
            {
                _logger.LogInformation("Worker running at: {time}", DateTimeOffset.Now);

                using IServiceScope scope = _scopeFactory.CreateScope();

                ApplicationDbContext dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                await FilterOldRecords(dbContext, stoppingToken);

                await ProcessQueue(dbContext, stoppingToken);
            }
            await Task.Delay(1000, stoppingToken);
        }
    }

    private async Task ProcessQueue(ApplicationDbContext dbContext, CancellationToken stoppingToken)
    {
        Queue? queueItem = await dbContext.Queue.FirstOrDefaultAsync(stoppingToken);

        if (queueItem != null)
        {
            try
            {
                HttpResponseMessage response = await GetApiResponseWithRetryAsync($"releases/{queueItem.RecordID.ToString()}", 3, 1000, stoppingToken);
                response.EnsureSuccessStatusCode();

                DiscogsRelease? releaseData = await response.Content.ReadFromJsonAsync<DiscogsRelease>();

                if (releaseData?.Thumb != null)
                {
                    string imageUrl = releaseData.Thumb;
                    byte[] imageBytes = await GetApiResponseWithRetryAsync(imageUrl, 3, 1000, stoppingToken).Result.Content.ReadAsByteArrayAsync(stoppingToken);

                    string filePath = Path.Combine(_pathOptions.ImagePath, queueItem.RecordID.ToString() + ".jpg");
                    await File.WriteAllBytesAsync(filePath, imageBytes, stoppingToken);

                    Record? existingRecord = await dbContext.Records
                        .FirstOrDefaultAsync(r => r.RecordID == queueItem.RecordID, stoppingToken);

                    if (existingRecord != null)
                    {
                        existingRecord.FilePath = $"{queueItem.RecordID.ToString()}.jpg";
                        existingRecord.Recorded = DateTime.Now;
                        dbContext.Records.Update(existingRecord);
                    }
                    else
                    {
                        Record newRecord = new()
                        {
                            RecordID = queueItem.RecordID,
                            FilePath = $"{queueItem.RecordID.ToString()}.jpg",
                            Recorded = DateTime.Now
                        };
                        dbContext.Records.Add(newRecord);
                    }

                    dbContext.Queue.Remove(queueItem);
                    await dbContext.SaveChangesAsync(stoppingToken);

                    _logger.LogInformation($"Processed and removed Queue item with ID {queueItem.Id}, saved image to {filePath}");
                }
                else
                {
                    _logger.LogWarning($"No thumbnail found for release ID {queueItem.RecordID}");
                    dbContext.Queue.Remove(queueItem);
                    await dbContext.SaveChangesAsync(stoppingToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"An error occurred while processing the queue ID {queueItem.Id}.");
                dbContext.Queue.Remove(queueItem);
                await dbContext.SaveChangesAsync(stoppingToken);
            }
        }
        else
        {
            _logger.LogInformation("Nothing in the queue.");
        }
    }

    private async Task FilterOldRecords(ApplicationDbContext dbContext, CancellationToken stoppingToken)
    {
        DateTime decay = DateTime.Now.AddMonths(-3);
        List<Record> oldRecords = await dbContext.Records
            .Where(r => r.Recorded < decay)
            .ToListAsync(stoppingToken);

        if (oldRecords.Any())
        {
            foreach (Record oldRecord in oldRecords)
            {
                bool isAlreadyInQueue = await dbContext.Queue
                    .AnyAsync(q => q.RecordID == oldRecord.RecordID, stoppingToken);

                if (!isAlreadyInQueue)
                {
                    Queue newQueueItem = new()
                    {
                        RecordID = oldRecord.RecordID
                    };
                    dbContext.Queue.Add(newQueueItem);
                }
            }
            await dbContext.SaveChangesAsync(stoppingToken);
            _logger.LogInformation($"Checked {oldRecords.Count} old records and added them to the queue if not already present.");
        }
    }

    private async Task<HttpResponseMessage> GetApiResponseWithRetryAsync(string requestUri, int maxRetries, int delayMilliseconds, CancellationToken stoppingToken)
    {
        int retryCount = 0;
        while (retryCount < maxRetries)
        {
            HttpResponseMessage response = await _httpClient.GetAsync(requestUri, stoppingToken);
            if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
            {
                _logger.LogWarning("Received 429 Too Many Requests. Retrying after delay...");
                await Task.Delay(delayMilliseconds);
                retryCount++;
                delayMilliseconds += 1000; // Exponential backoff
            }
            else
            {
                response.EnsureSuccessStatusCode();
                return response;
            }
        }
        throw new HttpRequestException("Maximum retry attempts exceeded.");
    }
}
