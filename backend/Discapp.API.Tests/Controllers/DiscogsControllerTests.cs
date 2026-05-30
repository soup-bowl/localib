using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Discapp.API.Controllers;
using Discapp.API.Models;
using Discapp.API.Models.Auth;
using Discapp.API.Models.Discogs;
using Discapp.API.Services;

namespace Discapp.API.Tests.Controllers;

public class DiscogsControllerTests
{
	private static DiscogsController CreateController(
		IAuthService authService,
		IImageProcessService imageService,
		HttpMessageHandler? handler = null)
	{
		handler ??= new FakeHttpMessageHandler(HttpStatusCode.OK, "{}");
		var factory = new Mock<IHttpClientFactory>();
		factory.Setup(f => f.CreateClient(It.IsAny<string>()))
			.Returns(new HttpClient(handler));
		return new DiscogsController(factory.Object, authService, imageService);
	}

	private static Mock<IAuthService> CreateAuthServiceWithValidToken()
	{
		var mock = new Mock<IAuthService>();
		mock.Setup(s => s.ExtractToken(It.IsAny<string>()))
			.Returns(new CallbackToken { AccessToken = "access", SecretToken = "secret" });
		mock.Setup(s => s.AuthenticatedRequestHeader(It.IsAny<CallbackToken>()))
			.Returns("OAuth oauth_token=\"access\"");
		mock.Setup(s => s.UserAgent()).Returns("TestAgent/1.0");
		return mock;
	}

	[Fact]
	public async Task GetIdentity_NullToken_ReturnsBadRequest()
	{
		var authService = new Mock<IAuthService>();
		authService.Setup(s => s.ExtractToken(It.IsAny<string>())).Returns((CallbackToken?)null);
		var imageService = new Mock<IImageProcessService>();

		var controller = CreateController(authService.Object, imageService.Object);

		ActionResult<DiscogsIdentity> result = await controller.GetIdentity("invalid");

		Assert.IsType<BadRequestObjectResult>(result.Result);
	}

	[Fact]
	public async Task GetIdentity_ValidToken_WhenDiscogsReturnsSuccess_ReturnsOk()
	{
		var identity = new DiscogsIdentity { Id = 42, Username = "testuser", ConsumerName = "TestApp" };
		string json = JsonSerializer.Serialize(identity);

		var handler = new FakeHttpMessageHandler(HttpStatusCode.OK, json);
		var authService = CreateAuthServiceWithValidToken();
		var imageService = new Mock<IImageProcessService>();

		var controller = CreateController(authService.Object, imageService.Object, handler);

		ActionResult<DiscogsIdentity> result = await controller.GetIdentity("some_token");

		OkObjectResult ok = Assert.IsType<OkObjectResult>(result.Result);
		DiscogsIdentity? returned = ok.Value as DiscogsIdentity;
		Assert.NotNull(returned);
		Assert.Equal(42, returned.Id);
		Assert.Equal("testuser", returned.Username);
	}

	[Fact]
	public async Task GetIdentity_ValidToken_WhenDiscogsReturnsError_ReturnsBadRequest()
	{
		var handler = new FakeHttpMessageHandler(HttpStatusCode.TooManyRequests, "Rate limited");
		var authService = CreateAuthServiceWithValidToken();
		var imageService = new Mock<IImageProcessService>();

		var controller = CreateController(authService.Object, imageService.Object, handler);

		ActionResult<DiscogsIdentity> result = await controller.GetIdentity("some_token");

		Assert.IsType<BadRequestObjectResult>(result.Result);
	}

	[Fact]
	public async Task GetRelease_NullToken_ReturnsBadRequest()
	{
		var authService = new Mock<IAuthService>();
		authService.Setup(s => s.ExtractToken(It.IsAny<string>())).Returns((CallbackToken?)null);
		var imageService = new Mock<IImageProcessService>();

		var controller = CreateController(authService.Object, imageService.Object);

		ActionResult<DiscogsReleaseExtended> result = await controller.GetRelease(123, "invalid");

		Assert.IsType<BadRequestObjectResult>(result.Result);
	}

	[Fact]
	public async Task GetCollections_NullToken_ReturnsBadRequest()
	{
		var authService = new Mock<IAuthService>();
		authService.Setup(s => s.ExtractToken(It.IsAny<string>())).Returns((CallbackToken?)null);
		var imageService = new Mock<IImageProcessService>();

		var controller = CreateController(authService.Object, imageService.Object);

		ActionResult<DiscogsCollectionsReturn> result = await controller.GetCollections("testuser", "invalid", new CollectionControls());

		Assert.IsType<BadRequestObjectResult>(result.Result);
	}

	[Fact]
	public async Task GetWants_NullToken_ReturnsBadRequest()
	{
		var authService = new Mock<IAuthService>();
		authService.Setup(s => s.ExtractToken(It.IsAny<string>())).Returns((CallbackToken?)null);
		var imageService = new Mock<IImageProcessService>();

		var controller = CreateController(authService.Object, imageService.Object);

		ActionResult<DiscogsWantsReturn> result = await controller.GetWants("testuser", "invalid", new CollectionControls());

		Assert.IsType<BadRequestObjectResult>(result.Result);
	}

	[Fact]
	public async Task GetCollections_ValidToken_MergesVinylAvailability()
	{
		var pagination = new DiscogsPagination { Page = 1, Pages = 1, PerPage = 50, Items = 1, Urls = new DiscogsPaginationUrls() };
		var release = new DiscogsReleaseCollection { Id = 7, InstanceId = 1, DateAdded = DateTime.UtcNow, Rating = 0, BasicInformation = new DiscogsRelease() };
		var collectionsReturn = new DiscogsCollectionsReturn
		{
			Pagination = pagination,
			Releases = [release]
		};
		string json = JsonSerializer.Serialize(collectionsReturn, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

		var handler = new FakeHttpMessageHandler(HttpStatusCode.OK, json);
		var authService = CreateAuthServiceWithValidToken();

		var imageService = new Mock<IImageProcessService>();
		var availableRecord = new AvailableRecord { RecordID = 7, Image = "data:image/jpeg;base64,abc", ImageHigh = "", Barcode = "123" };
		imageService.Setup(s => s.PostMyEntity(It.IsAny<int[]>()))
			.ReturnsAsync(new RecordReply { Available = [availableRecord], Queued = [] });

		var controller = CreateController(authService.Object, imageService.Object, handler);

		ActionResult<DiscogsCollectionsReturn> result = await controller.GetCollections("testuser", "token", new CollectionControls());

		OkObjectResult ok = Assert.IsType<OkObjectResult>(result.Result);
		DiscogsCollectionsReturn returned = Assert.IsType<DiscogsCollectionsReturn>(ok.Value);
		Assert.NotNull(returned.Releases[0].Vinyl);
		Assert.Equal("data:image/jpeg;base64,abc", returned.Releases[0].Vinyl!.Image);
	}
}
