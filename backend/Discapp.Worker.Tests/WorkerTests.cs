using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Discapp.Worker;
using Discapp.Worker.Models;
using Discapp.Shared.Data;
using Microsoft.Extensions.DependencyInjection;
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
		httpClientFactory.Setup(f => f.CreateClient("Discogs")).Returns(new HttpClient(handler));

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
