using System.Net;
using Discapp.Shared.Data;
using Discapp.Worker.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using SkiaSharp;
using DataRecord = Discapp.Shared.Data.Record;

namespace Discapp.Worker.Tests;

public class ArtworkProcessorTests : IDisposable
{
	private readonly ApplicationDbContext _dbContext;
	private readonly string _tempImagePath;

	public ArtworkProcessorTests()
	{
		var options = new DbContextOptionsBuilder<ApplicationDbContext>()
			.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
			.Options;
		_dbContext = new ApplicationDbContext(options);
		_tempImagePath = Path.Combine(Path.GetTempPath(), "artwork_test_" + Guid.NewGuid().ToString("N"));
		Directory.CreateDirectory(_tempImagePath);
	}

	public void Dispose()
	{
		_dbContext.Dispose();
		if (Directory.Exists(_tempImagePath))
			Directory.Delete(_tempImagePath, recursive: true);
	}

	private ArtworkProcessor CreateProcessor(Dictionary<string, Func<HttpResponseMessage>> routes) =>
		new(NullLogger.Instance, new PathSettings { ImagePath = _tempImagePath },
			new HttpClient(new RoutingHttpHandler(routes)) { BaseAddress = new Uri("https://api.example") });

	private static HttpResponseMessage Json(string json) =>
		new(HttpStatusCode.OK) { Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json") };

	private static HttpResponseMessage Jpeg()
	{
		using SKBitmap bitmap = new(new SKImageInfo(10, 10, SKColorType.Rgba8888, SKAlphaType.Premul));
		bitmap.Erase(SKColors.Red);
		using SKImage image = SKImage.FromBitmap(bitmap);
		using SKData data = image.Encode(SKEncodedImageFormat.Jpeg, 90)!;
		ByteArrayContent content = new(data.ToArray());
		content.Headers.ContentType = new("image/jpeg");
		return new(HttpStatusCode.OK) { Content = content };
	}

	[Fact]
	public async Task ProcessAsync_OnlySecondaryImages_WritesThumbAndHighQualityCover()
	{
		_dbContext.Queue.Add(new Queue { RecordID = 30 });
		await _dbContext.SaveChangesAsync();

		string releaseJson = """
		{
			"thumb": "https://img.example/thumb.jpg",
			"identifiers": [{ "type": "Barcode", "value": "123 456" }],
			"images": [{ "type": "secondary", "uri": "https://img.example/cover.jpg", "width": 600, "height": 600 }]
		}
		""";
		ArtworkProcessor processor = CreateProcessor(new()
		{
			["/releases/30"] = () => Json(releaseJson),
			["/thumb.jpg"] = Jpeg,
			["/cover.jpg"] = Jpeg,
		});

		ArtworkReport report = await processor.ProcessAsync(_dbContext, 30, CancellationToken.None);

		Assert.True(report.Success, report.Error);
		Assert.Equal("https://img.example/cover.jpg", report.CoverUrl);
		Assert.True(File.Exists(Path.Combine(_tempImagePath, "30_thumb.jpg")));
		Assert.True(File.Exists(Path.Combine(_tempImagePath, "30_w3.webp")));
		DataRecord record = Assert.Single(await _dbContext.Records.ToListAsync());
		Assert.Equal("123456", record.Barcode);
		Assert.Equal(0, await _dbContext.Queue.CountAsync());
	}

	[Fact]
	public async Task ProcessAsync_CoverDownloadFails_ReportsErrorAndSkipsRecord()
	{
		string releaseJson = """
		{ "thumb": "https://img.example/thumb.jpg", "identifiers": [], "images": [{ "type": "primary", "uri": "https://img.example/cover.jpg" }] }
		""";
		ArtworkProcessor processor = CreateProcessor(new()
		{
			["/releases/31"] = () => Json(releaseJson),
			["/thumb.jpg"] = Jpeg,
			["/cover.jpg"] = () => new HttpResponseMessage(HttpStatusCode.Forbidden),
		});

		ArtworkReport report = await processor.ProcessAsync(_dbContext, 31, CancellationToken.None);

		Assert.False(report.Success);
		Assert.Contains("403", report.Error);
		Assert.Contains(report.Steps, step => step.Contains("cover.jpg -> 403"));
		Assert.False(File.Exists(Path.Combine(_tempImagePath, "31_w3.webp")));
		Assert.Equal(0, await _dbContext.Records.CountAsync());
	}

	[Fact]
	public async Task ProcessAsync_NoImages_SavesRecordWithoutCover()
	{
		string releaseJson = """{ "thumb": "https://img.example/thumb.jpg", "identifiers": [], "images": [] }""";
		ArtworkProcessor processor = CreateProcessor(new()
		{
			["/releases/32"] = () => Json(releaseJson),
			["/thumb.jpg"] = Jpeg,
		});

		ArtworkReport report = await processor.ProcessAsync(_dbContext, 32, CancellationToken.None);

		Assert.True(report.Success, report.Error);
		Assert.Null(report.CoverPath);
		Assert.Contains(report.Steps, step => step.Contains("No usable cover image"));
		Assert.Equal(1, await _dbContext.Records.CountAsync());
	}
}

internal class RoutingHttpHandler(Dictionary<string, Func<HttpResponseMessage>> routes) : HttpMessageHandler
{
	protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
		Task.FromResult(routes.TryGetValue(request.RequestUri!.AbsolutePath, out Func<HttpResponseMessage>? route)
			? route()
			: new HttpResponseMessage(HttpStatusCode.NotFound));
}
