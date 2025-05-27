using Discapp.Worker.Models;
using Discapp.Shared.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Net.Http.Json;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Formats.Webp;

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
			BaseAddress = new Uri("https://api.discogs.com")
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
				_logger.LogInformation("Worker running at: {Time}", DateTimeOffset.Now);

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
				HttpResponseMessage response = await GetApiResponseWithRetryAsync($"releases/{queueItem.RecordID}", 3, 1000, stoppingToken);
				response.EnsureSuccessStatusCode();

				DiscogsRelease? releaseData = await response.Content.ReadFromJsonAsync<DiscogsRelease>(cancellationToken: stoppingToken);

				if (!string.IsNullOrEmpty(releaseData?.Thumb))
				{
					string imageUrl = releaseData.Thumb;
					byte[] imageBytes = await GetApiResponseWithRetryAsync(imageUrl, 3, 1000, stoppingToken).Result.Content.ReadAsByteArrayAsync(stoppingToken);

					string filePath = Path.Combine(_pathOptions.ImagePath, queueItem.RecordID.ToString() + "_thumb.jpg");
					await File.WriteAllBytesAsync(filePath, imageBytes, stoppingToken);

					string recordBarcode = releaseData.Identifiers
						.Where(id => id.Type == "Barcode")
						.Select(id => id.Value.Replace(" ", ""))
						.FirstOrDefault() ?? "";

					string mainCoverUri = releaseData.Images
						.Where(id => id.Type.Equals("primary", StringComparison.CurrentCultureIgnoreCase))
						.Select(id => id.Uri)
						.FirstOrDefault() ?? "";
					if (!string.IsNullOrEmpty(mainCoverUri))
					{
						byte[] mainCover = await GetApiResponseWithRetryAsync(mainCoverUri, 3, 1000, stoppingToken).Result.Content.ReadAsByteArrayAsync(stoppingToken);
						byte[] conversionOut = await ConvertImage(mainCover, 300, 300);
						await File.WriteAllBytesAsync(Path.Combine(_pathOptions.ImagePath, queueItem.RecordID.ToString() + "_w3.webp"), conversionOut, stoppingToken);
					}

					Record? existingRecord = await dbContext.Records
						.FirstOrDefaultAsync(r => r.RecordID == queueItem.RecordID, stoppingToken);

					if (existingRecord != null)
					{
						existingRecord.Recorded = DateTime.Now;
						dbContext.Records.Update(existingRecord);
					}
					else
					{
						Record newRecord = new()
						{
							RecordID = queueItem.RecordID,
							Barcode = recordBarcode,
							Recorded = DateTime.Now
						};
						dbContext.Records.Add(newRecord);
					}

					dbContext.Queue.Remove(queueItem);
					await dbContext.SaveChangesAsync(stoppingToken);

					_logger.LogInformation("Processed and removed Queue item with ID {QueueId}, saved image to {FilePath}", queueItem.Id, filePath);
				}
				else
				{
					_logger.LogWarning("No thumbnail found for release ID {RecordID}", queueItem.RecordID);
					dbContext.Queue.Remove(queueItem);
					await dbContext.SaveChangesAsync(stoppingToken);
				}
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "An error occurred while processing the queue ID {QueueItemId}.", queueItem.Id);
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

		if (oldRecords.Count > 0)
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
					dbContext.Records.Remove(oldRecord);
				}
			}
			await dbContext.SaveChangesAsync(stoppingToken);
			_logger.LogInformation("Checked {OldRecordCount} old records and added them to the queue if not already present.", oldRecords.Count);
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
				await Task.Delay(delayMilliseconds, stoppingToken);
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

	private async static Task<byte[]> ConvertImage(byte[] inputImageBytes, int width, int height)
	{
		using Image image = Image.Load(inputImageBytes);
		image.Mutate(x => x.Resize(width, height));
		using var outputStream = new MemoryStream();
		await image.SaveAsync(outputStream, new WebpEncoder());
		return outputStream.ToArray();
	}
}
