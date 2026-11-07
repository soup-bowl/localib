using Discapp.API.Controllers;
using Discapp.API.Models;
using Discapp.Shared.Data;
using Discapp.Worker;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using DataRecord = Discapp.Shared.Data.Record;

namespace Discapp.API.Tests.Controllers;

public class DebugControllerTests : IDisposable
{
	private readonly ApplicationDbContext _dbContext;
	private readonly string _tempImagePath;

	public DebugControllerTests()
	{
		var options = new DbContextOptionsBuilder<ApplicationDbContext>()
			.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
			.Options;
		_dbContext = new ApplicationDbContext(options);
		_tempImagePath = Path.Combine(Path.GetTempPath(), "debug_test_" + Guid.NewGuid().ToString("N"));
		Directory.CreateDirectory(_tempImagePath);
	}

	public void Dispose()
	{
		_dbContext.Dispose();
		if (Directory.Exists(_tempImagePath))
			Directory.Delete(_tempImagePath, recursive: true);
	}

	private DebugController CreateController(bool enabled)
	{
		ArtworkProcessor processor = new(NullLogger.Instance,
			new Discapp.Worker.Models.PathSettings { ImagePath = _tempImagePath },
			new HttpClient(new FakeHttpMessageHandler(System.Net.HttpStatusCode.InternalServerError, "")) { BaseAddress = new Uri("https://api.example") });

		return new DebugController(_dbContext, processor, new PathSettings { ImagePath = _tempImagePath }, new DebugSettings { Enabled = enabled });
	}

	[Fact]
	public async Task Endpoints_WhenDisabled_ReturnNotFound()
	{
		DebugController controller = CreateController(enabled: false);

		Assert.IsType<NotFoundResult>((await controller.GetArtworkStatus(1)).Result);
		Assert.IsType<NotFoundResult>((await controller.ProcessArtwork(1, CancellationToken.None)).Result);
		Assert.IsType<NotFoundResult>(controller.GetArtworkImage(1, "w3"));
	}

	[Fact]
	public async Task GetArtworkStatus_ReportsFilesAndRecord()
	{
		_dbContext.Records.Add(new DataRecord { RecordID = 5, Barcode = "", Recorded = DateTime.Now });
		await _dbContext.SaveChangesAsync();
		await File.WriteAllBytesAsync(Path.Combine(_tempImagePath, "5_thumb.jpg"), [1, 2, 3]);

		ActionResult<ArtworkStatus> result = await CreateController(enabled: true).GetArtworkStatus(5);

		ArtworkStatus status = Assert.IsType<ArtworkStatus>(Assert.IsType<OkObjectResult>(result.Result).Value);
		Assert.NotNull(status.Recorded);
		Assert.True(status.Thumb.Exists);
		Assert.Equal(3L, status.Thumb.Bytes);
		Assert.False(status.HighQuality.Exists);
	}

	[Fact]
	public async Task ProcessArtwork_DiscogsFailure_ReturnsReportWithError()
	{
		ActionResult<ArtworkDebugResult> result = await CreateController(enabled: true).ProcessArtwork(6, CancellationToken.None);

		ArtworkDebugResult debug = Assert.IsType<ArtworkDebugResult>(Assert.IsType<OkObjectResult>(result.Result).Value);
		Assert.False(debug.Report.Success);
		Assert.Contains("500", debug.Report.Error);
	}

	[Fact]
	public void GetArtworkImage_UnknownType_ReturnsBadRequest()
	{
		Assert.IsType<BadRequestObjectResult>(CreateController(enabled: true).GetArtworkImage(1, "../etc"));
	}
}
