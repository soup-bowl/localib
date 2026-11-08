using Discapp.Worker.Models;
using Discapp.Shared.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
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
	private readonly ArtworkProcessor _processor;

	public Worker(ILogger<Worker> logger, IServiceScopeFactory scopeFactory, IOptions<PathSettings> pathOptions, IHttpClientFactory httpClientFactory)
	{
		_logger = logger;
		_scopeFactory = scopeFactory;
		_processor = new ArtworkProcessor(logger, pathOptions.Value, httpClientFactory.CreateClient("Discogs"));
	}

	protected override async Task ExecuteAsync(CancellationToken stoppingToken)
	{
		while (!stoppingToken.IsCancellationRequested)
		{
			// An unhandled exception here would stop the whole host, which takes the API down with it.
			try
			{
				_logger.LogDebug("Worker running at: {Time}", DateTimeOffset.Now);

				using IServiceScope scope = _scopeFactory.CreateScope();

				ApplicationDbContext dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

				await FilterOldRecords(dbContext, stoppingToken);

				await ProcessQueue(dbContext, stoppingToken);
			}
			catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
			{
				break;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Worker iteration failed, will retry.");
			}
			await Task.Delay(1000, stoppingToken);
		}
	}

	internal async Task ProcessQueue(ApplicationDbContext dbContext, CancellationToken stoppingToken)
	{
		Queue? queueItem = await dbContext.Queue.FirstOrDefaultAsync(stoppingToken);

		if (queueItem == null)
		{
			_logger.LogDebug("Nothing in the queue.");
			return;
		}

		await _processor.ProcessAsync(dbContext, queueItem.RecordID, stoppingToken);
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

	/// <summary>
	/// Picks the primary image, falling back to the first image with a URI. Releases with no image marked as
	/// primary still have a thumbnail (Discogs derives it from the first image), so they need a cover too.
	/// </summary>
	internal static string SelectMainCoverUri(IEnumerable<DiscogsImages> images)
	{
		List<DiscogsImages> usable = [.. images.Where(image => !string.IsNullOrEmpty(image.Uri))];

		return (usable.FirstOrDefault(image => image.Type.Equals("primary", StringComparison.OrdinalIgnoreCase))
			?? usable.FirstOrDefault())?.Uri ?? "";
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
