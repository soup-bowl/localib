using Discapp.Shared.Data;
using Discapp.Worker.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Net.Http.Json;

namespace Discapp.Worker;

/// <summary>
/// Fetches a release from Discogs and stores its thumbnail and high quality cover. Shared by the queue Worker
/// and the debug endpoint, so the endpoint exercises exactly the same code path.
/// </summary>
public class ArtworkProcessor(ILogger logger, PathSettings pathSettings, HttpClient httpClient)
{
	private readonly ILogger _logger = logger;
	private readonly PathSettings _pathSettings = pathSettings;
	private readonly HttpClient _httpClient = httpClient;

	/// <summary>
	/// Processes the release, records it in the database and removes it from the queue. Failures are captured in
	/// the returned report rather than thrown, except for cancellation, which leaves the release queued.
	/// </summary>
	public async Task<ArtworkReport> ProcessAsync(ApplicationDbContext dbContext, int recordId, CancellationToken stoppingToken)
	{
		ArtworkReport report = new() { RecordId = recordId };

		try
		{
			await RunAsync(dbContext, report, stoppingToken);
		}
		catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
		{
			throw;
		}
		catch (Exception ex)
		{
			report.Success = false;
			report.Error = $"{ex.GetType().Name}: {ex.Message}";
			report.Step($"Failed: {report.Error}");
			_logger.LogError(ex, "Failed to process artwork for release ID {RecordID}. Steps: {Steps}", recordId, string.Join(" | ", report.Steps));
		}

		List<Queue> queued = await dbContext.Queue
			.Where(q => q.RecordID == recordId)
			.ToListAsync(stoppingToken);
		dbContext.Queue.RemoveRange(queued);
		await dbContext.SaveChangesAsync(stoppingToken);

		return report;
	}

	private async Task RunAsync(ApplicationDbContext dbContext, ArtworkReport report, CancellationToken stoppingToken)
	{
		int recordId = report.RecordId;

		using HttpResponseMessage response = await GetWithRetryAsync($"releases/{recordId}", report, stoppingToken);
		DiscogsRelease? releaseData = await response.Content.ReadFromJsonAsync<DiscogsRelease>(cancellationToken: stoppingToken);

		report.ThumbUrl = releaseData?.Thumb ?? "";
		report.Images = releaseData?.Images ?? [];
		report.Step($"Release has thumb: {!string.IsNullOrEmpty(report.ThumbUrl)}, images: {report.Images.Count} ({DescribeImages(report.Images)})");

		if (releaseData is null || string.IsNullOrEmpty(releaseData.Thumb))
		{
			report.Step("No thumbnail, release skipped.");
			_logger.LogWarning("No thumbnail found for release ID {RecordID}", recordId);
			return;
		}

		using (HttpResponseMessage imageResponse = await GetWithRetryAsync(releaseData.Thumb, report, stoppingToken))
		{
			byte[] imageBytes = await imageResponse.Content.ReadAsByteArrayAsync(stoppingToken);
			report.ThumbPath = Path.Combine(_pathSettings.ImagePath, $"{recordId}_thumb.jpg");
			await File.WriteAllBytesAsync(report.ThumbPath, imageBytes, stoppingToken);
			report.ThumbBytes = imageBytes.Length;
			report.Step($"Wrote thumbnail ({imageBytes.Length} bytes) to {report.ThumbPath}");
		}

		report.CoverUrl = Worker.SelectMainCoverUri(releaseData.Images);
		if (string.IsNullOrEmpty(report.CoverUrl))
		{
			report.Step("No usable cover image, high quality image skipped.");
			_logger.LogWarning("No cover image found for release ID {RecordID}, skipping high quality image.", recordId);
		}
		else
		{
			report.Step($"Selected cover {report.CoverUrl}");
			using HttpResponseMessage coverResponse = await GetWithRetryAsync(report.CoverUrl, report, stoppingToken);
			byte[] mainCover = await coverResponse.Content.ReadAsByteArrayAsync(stoppingToken);
			report.CoverContentType = coverResponse.Content.Headers.ContentType?.MediaType;
			report.CoverDownloadBytes = mainCover.Length;
			report.Step($"Downloaded cover ({mainCover.Length} bytes, {report.CoverContentType ?? "unknown type"})");

			byte[] conversionOut = await Worker.ConvertImage(mainCover, 300, 300);
			report.Step($"Converted cover to WebP ({conversionOut.Length} bytes)");

			report.CoverPath = Path.Combine(_pathSettings.ImagePath, $"{recordId}_w3.webp");
			await File.WriteAllBytesAsync(report.CoverPath, conversionOut, stoppingToken);
			report.CoverBytes = conversionOut.Length;
			report.Step($"Wrote cover to {report.CoverPath}");
		}

		string recordBarcode = releaseData.Identifiers
			.Where(id => id.Type == "Barcode")
			.Select(id => id.Value.Replace(" ", ""))
			.FirstOrDefault() ?? "";

		Record? existingRecord = await dbContext.Records
			.FirstOrDefaultAsync(r => r.RecordID == recordId, stoppingToken);

		if (existingRecord != null)
		{
			existingRecord.Recorded = DateTime.Now;
			dbContext.Records.Update(existingRecord);
		}
		else
		{
			dbContext.Records.Add(new Record
			{
				RecordID = recordId,
				Barcode = recordBarcode,
				Recorded = DateTime.Now
			});
		}

		report.Success = true;
		report.Step("Record saved.");
		_logger.LogInformation("Processed release ID {RecordID}: thumbnail {ThumbPath}, cover {CoverPath}", recordId, report.ThumbPath, report.CoverPath ?? "none");
	}

	private async Task<HttpResponseMessage> GetWithRetryAsync(string requestUri, ArtworkReport report, CancellationToken stoppingToken)
	{
		const int maxRetries = 3;
		int delayMilliseconds = 1000;

		for (int attempt = 0; attempt < maxRetries; attempt++)
		{
			HttpResponseMessage response = await _httpClient.GetAsync(requestUri, stoppingToken);
			report.Step($"GET {requestUri} -> {(int)response.StatusCode} {response.StatusCode}");

			if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
			{
				response.Dispose();
				_logger.LogWarning("Received 429 Too Many Requests. Retrying after delay...");
				await Task.Delay(delayMilliseconds, stoppingToken);
				delayMilliseconds += 1000; // Linear backoff
				continue;
			}

			if (!response.IsSuccessStatusCode)
			{
				response.Dispose();
				throw new HttpRequestException($"GET {requestUri} returned {(int)response.StatusCode} {response.StatusCode}.", null, response.StatusCode);
			}

			return response;
		}

		throw new HttpRequestException("Maximum retry attempts exceeded.");
	}

	private static string DescribeImages(IEnumerable<DiscogsImages> images) =>
		string.Join(", ", images.Select(image =>
			$"{(string.IsNullOrEmpty(image.Type) ? "untyped" : image.Type)} {image.Width}x{image.Height}{(string.IsNullOrEmpty(image.Uri) ? " (no URI)" : "")}"));
}
