using System.Net;
using System.Net.Http;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Discapp.API.Controllers;
using Discapp.API.Models.Auth;
using Discapp.API.Services;

namespace Discapp.API.Tests.Controllers;

public class AuthControllerTests
{
	private static AuthController CreateController(
		IAuthService authService,
		HttpMessageHandler? handler = null)
	{
		handler ??= new FakeHttpMessageHandler(HttpStatusCode.OK, "");
		var factory = new Mock<IHttpClientFactory>();
		factory.Setup(f => f.CreateClient(It.IsAny<string>()))
			.Returns(new HttpClient(handler));
		return new AuthController(factory.Object, authService);
	}

	[Fact]
	public async Task GetRequestToken_WhenDiscogsReturnsSuccess_ReturnsOkWithAuthToken()
	{
		string responseBody = "oauth_token=reqtoken&oauth_token_secret=reqsecret&oauth_callback_confirmed=true";
		var handler = new FakeHttpMessageHandler(HttpStatusCode.OK, responseBody);

		var authService = new Mock<IAuthService>();
		authService.Setup(s => s.TokenRequestHeader()).Returns("OAuth oauth_consumer_key=\"key\"");
		authService.Setup(s => s.UserAgent()).Returns("TestAgent/1.0");

		var controller = CreateController(authService.Object, handler);

		ActionResult<AuthToken> result = await controller.GetRequestToken();

		OkObjectResult ok = Assert.IsType<OkObjectResult>(result.Result);
		AuthToken token = Assert.IsType<AuthToken>(ok.Value);
		Assert.Contains("reqtoken", token.RedirectUrl);
		Assert.Equal("reqsecret", token.TokenSecret);
	}

	[Fact]
	public async Task GetRequestToken_WhenDiscogsReturnsError_ReturnsBadRequest()
	{
		var handler = new FakeHttpMessageHandler(HttpStatusCode.Unauthorized, "Unauthorized");
		var authService = new Mock<IAuthService>();
		authService.Setup(s => s.TokenRequestHeader()).Returns("OAuth ...");
		authService.Setup(s => s.UserAgent()).Returns("TestAgent/1.0");

		var controller = CreateController(authService.Object, handler);

		ActionResult<AuthToken> result = await controller.GetRequestToken();

		Assert.IsType<BadRequestObjectResult>(result.Result);
	}

	[Fact]
	public async Task HandleCallback_WhenDiscogsReturnsSuccess_ReturnsOkWithCallbackToken()
	{
		string responseBody = "oauth_token=accesstoken&oauth_token_secret=accesssecret";
		var handler = new FakeHttpMessageHandler(HttpStatusCode.OK, responseBody);

		var authService = new Mock<IAuthService>();
		authService.Setup(s => s.TokenCallbackHeader(It.IsAny<CallbackInput>())).Returns("OAuth ...");
		authService.Setup(s => s.UserAgent()).Returns("TestAgent/1.0");

		var controller = CreateController(authService.Object, handler);
		var input = new CallbackInput
		{
			OauthToken = "reqtoken",
			OauthSecret = "reqsecret",
			OauthVerifier = "verifier123"
		};

		ActionResult<CallbackToken> result = await controller.HandleCallback(input);

		OkObjectResult ok = Assert.IsType<OkObjectResult>(result.Result);
		CallbackToken token = Assert.IsType<CallbackToken>(ok.Value);
		Assert.Equal("accesstoken", token.AccessToken);
		Assert.Equal("accesssecret", token.SecretToken);
	}

	[Fact]
	public async Task HandleCallback_WhenDiscogsReturnsError_ReturnsBadRequest()
	{
		var handler = new FakeHttpMessageHandler(HttpStatusCode.Forbidden, "Forbidden");
		var authService = new Mock<IAuthService>();
		authService.Setup(s => s.TokenCallbackHeader(It.IsAny<CallbackInput>())).Returns("OAuth ...");
		authService.Setup(s => s.UserAgent()).Returns("TestAgent/1.0");

		var controller = CreateController(authService.Object, handler);
		var input = new CallbackInput();

		ActionResult<CallbackToken> result = await controller.HandleCallback(input);

		Assert.IsType<BadRequestObjectResult>(result.Result);
	}
}

internal class FakeHttpMessageHandler(HttpStatusCode statusCode, string content) : HttpMessageHandler
{
	protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
	{
		HttpResponseMessage response = new(statusCode)
		{
			Content = new StringContent(content, Encoding.UTF8, "application/x-www-form-urlencoded")
		};
		return Task.FromResult(response);
	}
}
