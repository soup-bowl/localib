using Discapp.Worker.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Net.Http.Json;

namespace Discapp.Worker;

public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly DiscogsOptions _discogsOptions;
    private readonly HttpClient _httpClient;

    public Worker(ILogger<Worker> logger, IServiceScopeFactory scopeFactory, IOptions<DiscogsOptions> discogsOptions)
    {
        _logger = logger;
        _scopeFactory = scopeFactory;
        _discogsOptions = discogsOptions.Value;
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

                Queue? queueItem = await dbContext.Queue.FirstOrDefaultAsync(stoppingToken);

                if (queueItem != null)
                {
                    try
                    {
                        HttpResponseMessage response = await _httpClient.GetAsync($"releases/{queueItem.RecordID}", stoppingToken);
                        response.EnsureSuccessStatusCode();

                        DiscogsRelease? releaseData = await response.Content.ReadFromJsonAsync<DiscogsRelease>();

                        if (releaseData?.Thumb != null)
                        {
                            string imageUrl = releaseData.Thumb;
                            byte[] imageBytes = await _httpClient.GetByteArrayAsync(imageUrl);

                            string filePath = Path.Combine("Images", $"{queueItem.RecordID}.jpg");
                            await File.WriteAllBytesAsync(filePath, imageBytes, stoppingToken);

                            Record newRecord = new()
                            {
                                RecordID = queueItem.RecordID,
                                FilePath = filePath,
                                Recorded = DateTime.Now
                            };

                            dbContext.Records.Add(newRecord);
                            dbContext.Queue.Remove(queueItem);
                            await dbContext.SaveChangesAsync(stoppingToken);

                            _logger.LogInformation($"Processed and removed Queue item with ID {queueItem.Id}, saved image to {filePath}");
                        }
                        else
                        {
                            _logger.LogWarning($"No thumbnail found for release ID {queueItem.RecordID}");
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"An error occurred while processing the queue ID {queueItem.Id}.");
                    }
                }
                else
                {
                    _logger.LogInformation("Nothing in the queue.");
                }
            }
            await Task.Delay(1000, stoppingToken);
        }
    }
}
