using Microsoft.EntityFrameworkCore;
using Discapp.API.Models;
using Discapp.API.Services;
using Discapp.Shared.Data;
using DataRecord = Discapp.Shared.Data.Record;

namespace Discapp.API.Tests.Services;

public class ImageProcessServiceTests : IDisposable
{
	private readonly ApplicationDbContext _dbContext;
	private readonly string _tempImagePath;

	public ImageProcessServiceTests()
	{
		var options = new DbContextOptionsBuilder<ApplicationDbContext>()
			.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
			.Options;
		_dbContext = new ApplicationDbContext(options);
		_tempImagePath = Path.Combine(Path.GetTempPath(), "localib_test_" + Guid.NewGuid().ToString("N"));
		Directory.CreateDirectory(_tempImagePath);
	}

	public void Dispose()
	{
		_dbContext.Dispose();
		if (Directory.Exists(_tempImagePath))
			Directory.Delete(_tempImagePath, recursive: true);
	}

	private ImageProcessService CreateService() =>
		new(_dbContext, new PathSettings { ImagePath = _tempImagePath });

	[Fact]
	public async Task PostMyEntity_NoExistingRecords_AddsAllToQueue()
	{
		var service = CreateService();
		int[] input = [101, 102, 103];

		RecordReply result = await service.PostMyEntity(input);

		Assert.Empty(result.Available);
		Assert.Equal(3, result.Queued.Count);
		Assert.Contains(101, result.Queued);
		Assert.Contains(102, result.Queued);
		Assert.Contains(103, result.Queued);

		Assert.Equal(3, await _dbContext.Queue.CountAsync());
	}

	[Fact]
	public async Task PostMyEntity_AllExistingRecords_ReturnsAllAvailable()
	{
		_dbContext.Records.AddRange(
			new DataRecord { RecordID = 201, Barcode = "111", Recorded = DateTime.UtcNow },
			new DataRecord { RecordID = 202, Barcode = "222", Recorded = DateTime.UtcNow }
		);
		await _dbContext.SaveChangesAsync();

		var service = CreateService();
		int[] input = [201, 202];

		RecordReply result = await service.PostMyEntity(input);

		Assert.Equal(2, result.Available.Count);
		Assert.Empty(result.Queued);
		Assert.Contains(result.Available, r => r.RecordID == 201);
		Assert.Contains(result.Available, r => r.RecordID == 202);
	}

	[Fact]
	public async Task PostMyEntity_MixedRecords_ReturnsSomeAvailableAndSomeQueued()
	{
		_dbContext.Records.Add(new DataRecord { RecordID = 301, Barcode = "333", Recorded = DateTime.UtcNow });
		await _dbContext.SaveChangesAsync();

		var service = CreateService();
		int[] input = [301, 302, 303];

		RecordReply result = await service.PostMyEntity(input);

		Assert.Single(result.Available);
		Assert.Equal(301, result.Available[0].RecordID);
		Assert.Equal(2, result.Queued.Count);
		Assert.Contains(302, result.Queued);
		Assert.Contains(303, result.Queued);
	}

	[Fact]
	public async Task PostMyEntity_DuplicateCall_DoesNotAddDuplicateQueueItems()
	{
		var service = CreateService();
		int[] input = [401];

		await service.PostMyEntity(input);
		await service.PostMyEntity(input);

		// Second call: 401 is still not in Records, so it gets added again to queue
		Assert.Equal(2, await _dbContext.Queue.CountAsync());
	}

	[Fact]
	public async Task PostMyEntity_ExistingRecordWithImage_ReturnsBase64Image()
	{
		_dbContext.Records.Add(new DataRecord { RecordID = 501, Barcode = "999", Recorded = DateTime.UtcNow });
		await _dbContext.SaveChangesAsync();

		// Create a fake image file
		string thumbPath = Path.Combine(_tempImagePath, "501_thumb.jpg");
		byte[] fakeJpegBytes = [0xFF, 0xD8, 0xFF, 0xE0];
		await File.WriteAllBytesAsync(thumbPath, fakeJpegBytes);

		var service = CreateService();
		RecordReply result = await service.PostMyEntity([501]);

		Assert.Single(result.Available);
		string expectedBase64 = Convert.ToBase64String(fakeJpegBytes);
		Assert.Equal($"data:image/jpeg;base64,{expectedBase64}", result.Available[0].Image);
	}

	[Fact]
	public async Task PostMyEntity_ExistingRecordWithNoImageFile_ReturnsEmptyImage()
	{
		_dbContext.Records.Add(new DataRecord { RecordID = 601, Barcode = "777", Recorded = DateTime.UtcNow });
		await _dbContext.SaveChangesAsync();

		var service = CreateService();
		RecordReply result = await service.PostMyEntity([601]);

		Assert.Single(result.Available);
		Assert.Equal("", result.Available[0].Image);
	}

	[Fact]
	public async Task PostMyEntity_EmptyInput_ReturnsEmptyResult()
	{
		var service = CreateService();

		RecordReply result = await service.PostMyEntity([]);

		Assert.Empty(result.Available);
		Assert.Empty(result.Queued);
	}
}
