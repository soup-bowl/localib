using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Discapp.Worker;
using Discapp.Worker.Models;
using Discapp.Shared.Data;
using Microsoft.Extensions.DependencyInjection;
using SkiaSharp;
using DataRecord = Discapp.Shared.Data.Record;

namespace Discapp.Worker.Tests;

public class WorkerFilterOldRecordsTests : IDisposable
{
	private readonly ApplicationDbContext _dbContext;

	public WorkerFilterOldRecordsTests()
	{
		var options = new DbContextOptionsBuilder<ApplicationDbContext>()
			.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
			.Options;
		_dbContext = new ApplicationDbContext(options);
	}

	public void Dispose() => _dbContext.Dispose();

	private static Worker CreateWorker(ApplicationDbContext? dbContext = null)
	{
		var logger = new Mock<ILogger<Worker>>();
		logger.Setup(l => l.IsEnabled(It.IsAny<LogLevel>())).Returns(false);

		var scopeFactory = new Mock<IServiceScopeFactory>();

		var pathOptions = new Mock<IOptions<PathSettings>>();
		pathOptions.Setup(p => p.Value).Returns(new PathSettings { ImagePath = Path.GetTempPath() });

		var httpClientFactory = new Mock<IHttpClientFactory>();
		httpClientFactory.Setup(f => f.CreateClient("Discogs")).Returns(new HttpClient());

		return new Worker(logger.Object, scopeFactory.Object, pathOptions.Object, httpClientFactory.Object);
	}

	[Fact]
	public async Task FilterOldRecords_NoOldRecords_DoesNotModifyQueue()
	{
		_dbContext.Records.Add(new DataRecord
		{
			RecordID = 1,
			Barcode = "111",
			Recorded = DateTime.UtcNow
		});
		await _dbContext.SaveChangesAsync();

		var worker = CreateWorker();
		await worker.FilterOldRecords(_dbContext, CancellationToken.None);

		Assert.Equal(0, await _dbContext.Queue.CountAsync());
	}

	[Fact]
	public async Task FilterOldRecords_OldRecord_AddsToQueueAndRemovesRecord()
	{
		_dbContext.Records.Add(new DataRecord
		{
			RecordID = 2,
			Barcode = "222",
			Recorded = DateTime.UtcNow.AddMonths(-4)
		});
		await _dbContext.SaveChangesAsync();

		var worker = CreateWorker();
		await worker.FilterOldRecords(_dbContext, CancellationToken.None);

		Assert.Equal(1, await _dbContext.Queue.CountAsync());
		Assert.Equal(0, await _dbContext.Records.CountAsync());
		Queue queueItem = await _dbContext.Queue.FirstAsync();
		Assert.Equal(2, queueItem.RecordID);
	}

	[Fact]
	public async Task FilterOldRecords_OldRecordAlreadyInQueue_DoesNotAddDuplicate()
	{
		_dbContext.Records.Add(new DataRecord
		{
			RecordID = 3,
			Barcode = "333",
			Recorded = DateTime.UtcNow.AddMonths(-4)
		});
		_dbContext.Queue.Add(new Queue { RecordID = 3 });
		await _dbContext.SaveChangesAsync();

		var worker = CreateWorker();
		await worker.FilterOldRecords(_dbContext, CancellationToken.None);

		// Should still have only 1 queue entry, record not removed since already queued
		Assert.Equal(1, await _dbContext.Queue.CountAsync());
	}

	[Fact]
	public async Task FilterOldRecords_MultipleOldRecords_AddsAllToQueue()
	{
		_dbContext.Records.AddRange(
			new DataRecord { RecordID = 4, Barcode = "444", Recorded = DateTime.UtcNow.AddMonths(-4) },
			new DataRecord { RecordID = 5, Barcode = "555", Recorded = DateTime.UtcNow.AddMonths(-5) },
			new DataRecord { RecordID = 6, Barcode = "666", Recorded = DateTime.UtcNow }
		);
		await _dbContext.SaveChangesAsync();

		var worker = CreateWorker();
		await worker.FilterOldRecords(_dbContext, CancellationToken.None);

		Assert.Equal(2, await _dbContext.Queue.CountAsync());
		Assert.Equal(1, await _dbContext.Records.CountAsync());
	}
}

public class WorkerProcessQueueTests : IDisposable
{
	private readonly ApplicationDbContext _dbContext;
	private readonly string _tempImagePath;

	public WorkerProcessQueueTests()
	{
		var options = new DbContextOptionsBuilder<ApplicationDbContext>()
			.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
			.Options;
		_dbContext = new ApplicationDbContext(options);
		_tempImagePath = Path.Combine(Path.GetTempPath(), "worker_test_" + Guid.NewGuid().ToString("N"));
		Directory.CreateDirectory(_tempImagePath);
	}

	public void Dispose()
	{
		_dbContext.Dispose();
		if (Directory.Exists(_tempImagePath))
			Directory.Delete(_tempImagePath, recursive: true);
	}

	private Worker CreateWorkerWithHandler(HttpMessageHandler handler)
	{
		var logger = new Mock<ILogger<Worker>>();
		logger.Setup(l => l.IsEnabled(It.IsAny<LogLevel>())).Returns(false);

		var scopeFactory = new Mock<IServiceScopeFactory>();

		var pathOptions = new Mock<IOptions<PathSettings>>();
		pathOptions.Setup(p => p.Value).Returns(new PathSettings { ImagePath = _tempImagePath });

		var httpClientFactory = new Mock<IHttpClientFactory>();
		httpClientFactory.Setup(f => f.CreateClient("Discogs")).Returns(new HttpClient(handler) { BaseAddress = new Uri("https://api.example") });

		return new Worker(logger.Object, scopeFactory.Object, pathOptions.Object, httpClientFactory.Object);
	}

	[Fact]
	public async Task ProcessQueue_EmptyQueue_DoesNotThrow()
	{
		var handler = new NullHttpHandler();
		var worker = CreateWorkerWithHandler(handler);

		await worker.ProcessQueue(_dbContext, CancellationToken.None);

		Assert.Equal(0, await _dbContext.Queue.CountAsync());
	}

	[Fact]
	public async Task ProcessQueue_QueueItemWithNoThumb_RemovesItemFromQueue()
	{
		_dbContext.Queue.Add(new Queue { RecordID = 10 });
		await _dbContext.SaveChangesAsync();

		string releaseJson = """{"thumb":"","identifiers":[],"images":[]}""";
		var handler = new FakeHttpMessageHandler(System.Net.HttpStatusCode.OK, releaseJson);
		var worker = CreateWorkerWithHandler(handler);

		await worker.ProcessQueue(_dbContext, CancellationToken.None);

		Assert.Equal(0, await _dbContext.Queue.CountAsync());
		Assert.Equal(0, await _dbContext.Records.CountAsync());
	}

	[Fact]
	public async Task ProcessQueue_HttpFailure_RemovesItemFromQueue()
	{
		_dbContext.Queue.Add(new Queue { RecordID = 11 });
		await _dbContext.SaveChangesAsync();

		var handler = new FakeHttpMessageHandler(System.Net.HttpStatusCode.InternalServerError, "Error");
		var worker = CreateWorkerWithHandler(handler);

		// Should handle exception gracefully
		await worker.ProcessQueue(_dbContext, CancellationToken.None);

		Assert.Equal(0, await _dbContext.Queue.CountAsync());
	}

	[Fact]
	public async Task ProcessQueue_DuplicateQueueEntries_RemovesAllEntriesForRecord()
	{
		_dbContext.Queue.AddRange(
			new Queue { RecordID = 12 },
			new Queue { RecordID = 12 },
			new Queue { RecordID = 13 }
		);
		await _dbContext.SaveChangesAsync();

		string releaseJson = """{"thumb":"","identifiers":[],"images":[]}""";
		var worker = CreateWorkerWithHandler(new FakeHttpMessageHandler(System.Net.HttpStatusCode.OK, releaseJson));

		await worker.ProcessQueue(_dbContext, CancellationToken.None);

		Queue remaining = Assert.Single(await _dbContext.Queue.ToListAsync());
		Assert.Equal(13, remaining.RecordID);
	}

	[Fact]
	public async Task ProcessQueue_CancelledDuringShutdown_LeavesItemQueued()
	{
		_dbContext.Queue.Add(new Queue { RecordID = 14 });
		await _dbContext.SaveChangesAsync();

		using var cts = new CancellationTokenSource();
		var worker = CreateWorkerWithHandler(new CancellingHttpHandler(cts));

		await Assert.ThrowsAnyAsync<OperationCanceledException>(() => worker.ProcessQueue(_dbContext, cts.Token));

		Assert.Equal(1, await _dbContext.Queue.CountAsync());
	}
}

public class WorkerExecuteTests
{
	[Fact]
	public async Task ExecuteAsync_InformationLoggingDisabled_StillProcessesQueue()
	{
		string databaseName = Guid.NewGuid().ToString();
		ServiceProvider services = new ServiceCollection()
			.AddDbContext<ApplicationDbContext>(o => o.UseInMemoryDatabase(databaseName))
			.BuildServiceProvider();

		using (IServiceScope seedScope = services.CreateScope())
		{
			ApplicationDbContext seedContext = seedScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
			seedContext.Queue.Add(new Queue { RecordID = 20 });
			await seedContext.SaveChangesAsync();
		}

		var logger = new Mock<ILogger<Worker>>();
		logger.Setup(l => l.IsEnabled(It.IsAny<LogLevel>())).Returns(false);

		var pathOptions = new Mock<IOptions<PathSettings>>();
		pathOptions.Setup(p => p.Value).Returns(new PathSettings { ImagePath = Path.GetTempPath() });

		string releaseJson = """{"thumb":"","identifiers":[],"images":[]}""";
		var httpClientFactory = new Mock<IHttpClientFactory>();
		httpClientFactory.Setup(f => f.CreateClient("Discogs"))
			.Returns(new HttpClient(new FakeHttpMessageHandler(System.Net.HttpStatusCode.OK, releaseJson)) { BaseAddress = new Uri("https://api.example") });

		var worker = new Worker(logger.Object, services.GetRequiredService<IServiceScopeFactory>(), pathOptions.Object, httpClientFactory.Object);

		await worker.StartAsync(CancellationToken.None);
		try
		{
			int remaining = 1;
			for (int attempt = 0; attempt < 50 && remaining > 0; attempt++)
			{
				await Task.Delay(100);
				using IServiceScope checkScope = services.CreateScope();
				remaining = await checkScope.ServiceProvider.GetRequiredService<ApplicationDbContext>().Queue.CountAsync();
			}

			Assert.Equal(0, remaining);
		}
		finally
		{
			await worker.StopAsync(CancellationToken.None);
			await services.DisposeAsync();
		}
	}
}

public class WorkerConvertImageTests
{
	[Fact]
	public async Task ConvertImage_ValidJpeg_ProducesDecodable300By300Webp()
	{
		byte[] jpeg = CreateJpeg(80, 60, (x, y) => x < 40 ? SKColors.Red : SKColors.Blue);

		byte[] webp = await Worker.ConvertImage(jpeg, 300, 300);
		using SKData data = SKData.CreateCopy(webp);
		using SKCodec codec = SKCodec.Create(data) ?? throw new InvalidOperationException("Output was not a decodable image.");

		Assert.Equal(SKEncodedImageFormat.Webp, codec.EncodedFormat);
		Assert.Equal(300, codec.Info.Width);
		Assert.Equal(300, codec.Info.Height);
	}

	[Fact]
	public async Task ConvertImage_NonSquareInput_StretchesToRequestedDimensions()
	{
		byte[] jpeg = CreateJpeg(100, 20, (x, y) => x < 50 ? SKColors.Red : SKColors.Blue);

		byte[] webp = await Worker.ConvertImage(jpeg, 300, 300);
		using SKBitmap bitmap = SKBitmap.Decode(webp) ?? throw new InvalidOperationException("Output was not a decodable image.");

		Assert.True(bitmap.GetPixel(75, 150).Red > bitmap.GetPixel(75, 150).Blue);
		Assert.True(bitmap.GetPixel(225, 150).Blue > bitmap.GetPixel(225, 150).Red);
		Assert.Equal(150, FindColorTransition(bitmap));
	}

	[Fact]
	public async Task ConvertImage_MalformedInput_ThrowsHelpfulError()
	{
		InvalidDataException exception = await Assert.ThrowsAsync<InvalidDataException>(
			() => Worker.ConvertImage([1, 2, 3, 4], 300, 300));

		Assert.Contains("malformed or uses an unsupported format", exception.Message);
	}

	[Fact]
	public async Task ConvertImage_OversizedInput_RejectsBeforeDecoding()
	{
		byte[] oversized = new byte[20 * 1024 * 1024 + 1];

		InvalidDataException exception = await Assert.ThrowsAsync<InvalidDataException>(
			() => Worker.ConvertImage(oversized, 300, 300));

		Assert.Contains("byte limit", exception.Message);
	}

	[Fact]
	public async Task ConvertImage_OversizedDimensions_RejectsBeforeDecoding()
	{
		using SKBitmap oversized = new(new SKImageInfo(10_001, 1, SKColorType.Rgba8888, SKAlphaType.Premul));
		using SKImage image = SKImage.FromBitmap(oversized);
		using SKData oversizedJpeg = image.Encode(SKEncodedImageFormat.Jpeg, 100)
			?? throw new InvalidOperationException("Test input could not be encoded.");

		InvalidDataException exception = await Assert.ThrowsAsync<InvalidDataException>(
			() => Worker.ConvertImage(oversizedJpeg.ToArray(), 300, 300));

		Assert.Contains("Image dimensions", exception.Message);
	}

	private static byte[] CreateJpeg(int width, int height, Func<int, int, SKColor> colorAt)
	{
		using SKBitmap bitmap = new(new SKImageInfo(width, height, SKColorType.Rgba8888, SKAlphaType.Premul));
		for (int y = 0; y < height; y++)
			for (int x = 0; x < width; x++)
				bitmap.SetPixel(x, y, colorAt(x, y));

		using SKImage image = SKImage.FromBitmap(bitmap);
		using SKData data = image.Encode(SKEncodedImageFormat.Jpeg, 100)
			?? throw new InvalidOperationException("Test input could not be encoded.");
		return data.ToArray();
	}

	private static int FindColorTransition(SKBitmap bitmap)
	{
		for (int x = 1; x < bitmap.Width; x++)
		{
			SKColor previous = bitmap.GetPixel(x - 1, bitmap.Height / 2);
			SKColor current = bitmap.GetPixel(x, bitmap.Height / 2);
			if (previous.Red > previous.Blue && current.Blue > current.Red)
				return x;
		}

		return -1;
	}
}

internal class CancellingHttpHandler(CancellationTokenSource cts) : HttpMessageHandler
{
	protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
	{
		cts.Cancel();
		throw new OperationCanceledException(cts.Token);
	}
}

internal class NullHttpHandler : HttpMessageHandler
{
	protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
	{
		return Task.FromResult(new HttpResponseMessage(System.Net.HttpStatusCode.OK)
		{
			Content = new System.Net.Http.StringContent("{}", System.Text.Encoding.UTF8, "application/json")
		});
	}
}

internal class FakeHttpMessageHandler(System.Net.HttpStatusCode statusCode, string content) : HttpMessageHandler
{
	protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
	{
		return Task.FromResult(new HttpResponseMessage(statusCode)
		{
			Content = new System.Net.Http.StringContent(content, System.Text.Encoding.UTF8, "application/json")
		});
	}
}
