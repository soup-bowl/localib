using Discapp.Worker.Models;
using Discapp.Shared.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Net.Http.Json;
using SkiaSharp;

[assembly: System.Runtime.CompilerServices.InternalsVisibleTo("Discapp.Worker.Tests")]

namespace Discapp.Worker;

public class Worker : BackgroundService
{
	private const int MaxImageInputBytes = 20 * 1024 * 1024;
	private const int MaxImageDimension = 10_000;
	private const long MaxImagePixels = 20_000_000;

	private readonly ILogger<Worker> _logger;
	private readonly IServiceScopeFactory _scopeFactory;
	private readonly PathSettings _pathOptions;
	private readonly HttpClient _httpClient;

	public Worker(ILogger<Worker> logger, IServiceScopeFactory scopeFactory, IOptions<PathSettings> pathOptions, IHttpClientFactory httpClientFactory)
	{
		_logger = logger;
		_scopeFactory = scopeFactory;
		_pathOptions = pathOptions.Value;
		_httpClient = httpClientFactory.CreateClient("Discogs");
	}

	protected override async Task ExecuteAsync(CancellationToken stoppingToken)
	{
		while (!stoppingToken.IsCancellationRequested)
		{
			if (_logger.IsEnabled(LogLevel.Information))
			{
				_logger.LogInformation("Worker running at: {Time}", DateTimeOffset.Now);
			}

			using (IServiceScope scope = _scopeFactory.CreateScope())
			{
				ApplicationDbContext dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

				await FilterOldRecords(dbContext, stoppingToken);

				await ProcessQueue(dbContext, stoppingToken);
			}

			await Task.Delay(1000, stoppingToken);
		}
	}

	internal async Task ProcessQueue(ApplicationDbContext dbContext, CancellationToken stoppingToken)
	{
		Queue? queueItem = await dbContext.Queue.FirstOrDefaultAsync(stoppingToken);

		if (queueItem != null)
		{
			try
			{
				using HttpResponseMessage response = await GetApiResponseWithRetryAsync($"releases/{queueItem.RecordID}", 3, 1000, stoppingToken);

				DiscogsRelease? releaseData = await response.Content.ReadFromJsonAsync<DiscogsRelease>(cancellationToken: stoppingToken);

				if (!string.IsNullOrEmpty(releaseData?.Thumb))
				{
					string imageUrl = releaseData.Thumb;
					using HttpResponseMessage imageResponse = await GetApiResponseWithRetryAsync(imageUrl, 3, 1000, stoppingToken);
					byte[] imageBytes = await imageResponse.Content.ReadAsByteArrayAsync(stoppingToken);

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
						using HttpResponseMessage coverResponse = await GetApiResponseWithRetryAsync(mainCoverUri, 3, 1000, stoppingToken);
						byte[] mainCover = await coverResponse.Content.ReadAsByteArrayAsync(stoppingToken);
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

					await RemoveFromQueueAsync(dbContext, queueItem.RecordID, stoppingToken);
					await dbContext.SaveChangesAsync(stoppingToken);

					_logger.LogInformation("Processed and removed Queue item with ID {QueueId}, saved image to {FilePath}", queueItem.Id, filePath);
				}
				else
				{
					_logger.LogWarning("No thumbnail found for release ID {RecordID}", queueItem.RecordID);
					await RemoveFromQueueAsync(dbContext, queueItem.RecordID, stoppingToken);
					await dbContext.SaveChangesAsync(stoppingToken);
				}
			}
			catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
			{
				// Shutting down - leave the item queued so it is picked up on the next run.
				throw;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "An error occurred while processing the queue ID {QueueItemId}.", queueItem.Id);
				await RemoveFromQueueAsync(dbContext, queueItem.RecordID, stoppingToken);
				await dbContext.SaveChangesAsync(stoppingToken);
			}
		}
		else
		{
			_logger.LogInformation("Nothing in the queue.");
		}
	}

	internal async Task FilterOldRecords(ApplicationDbContext dbContext, CancellationToken stoppingToken)
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
				delayMilliseconds += 1000; // Linear backoff
			}
			else
			{
				response.EnsureSuccessStatusCode();
				return response;
			}
		}
		throw new HttpRequestException("Maximum retry attempts exceeded.");
	}

	/// <summary>
	/// Removes every queue entry for the record, clearing out any duplicates queued alongside it.
	/// </summary>
	private static async Task RemoveFromQueueAsync(ApplicationDbContext dbContext, int recordId, CancellationToken stoppingToken)
	{
		List<Queue> entries = await dbContext.Queue
			.Where(q => q.RecordID == recordId)
			.ToListAsync(stoppingToken);

		dbContext.Queue.RemoveRange(entries);
	}

	internal static Task<byte[]> ConvertImage(byte[] inputImageBytes, int width, int height)
	{
		ArgumentNullException.ThrowIfNull(inputImageBytes);
		ValidateDimensions(width, height);

		if (inputImageBytes.Length > MaxImageInputBytes)
			throw new InvalidDataException($"Image input exceeds the {MaxImageInputBytes}-byte limit.");

		using SKData encodedData = SKData.CreateCopy(inputImageBytes);
		using SKCodec codec = SKCodec.Create(encodedData)
			?? throw new InvalidDataException("Image input is malformed or uses an unsupported format.");
		SKImageInfo sourceInfo = codec.Info;
		ValidateDimensions(sourceInfo.Width, sourceInfo.Height);

		using SKBitmap sourceBitmap = SKBitmap.Decode(codec)
			?? throw new InvalidDataException("Image input could not be decoded.");
		using SKBitmap resizedBitmap = new(new SKImageInfo(width, height, SKColorType.Rgba8888, SKAlphaType.Premul));
		using (SKCanvas canvas = new(resizedBitmap))
		{
			canvas.DrawBitmap(sourceBitmap, new SKRect(0, 0, width, height), new SKSamplingOptions(SKCubicResampler.CatmullRom));
		}

		using SKImage resizedImage = SKImage.FromBitmap(resizedBitmap);
		using SKData webpData = resizedImage.Encode(SKEncodedImageFormat.Webp, 75)
			?? throw new InvalidDataException("Image could not be encoded as WebP.");
		return Task.FromResult(webpData.ToArray());
	}

	private static void ValidateDimensions(int width, int height)
	{
		if (width <= 0 || height <= 0 || width > MaxImageDimension || height > MaxImageDimension ||
			(long)width * height > MaxImagePixels)
			throw new InvalidDataException($"Image dimensions must be positive, no larger than {MaxImageDimension} per side, and no more than {MaxImagePixels} pixels.");
	}
}
