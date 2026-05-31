using Discapp.API.Models.Auth;
using Discapp.API.Services;

namespace Discapp.API.Tests.Services;

public class AuthServiceTests
{
	private static AuthService CreateService(
		string consumerKey = "test_key",
		string consumerSecret = "test_secret",
		string callbackUrl = "https://example.com/callback")
	{
		var settings = new AuthSettings
		{
			ConsumerKey = consumerKey,
			ConsumerSecret = consumerSecret,
			CallbackURL = callbackUrl
		};
		return new AuthService(settings);
	}

	[Fact]
	public void UserAgent_ReturnsExpectedString()
	{
		var service = CreateService();

		string userAgent = service.UserAgent();

		Assert.Equal("LocalibOfflineCollector/0.1 (https://vinyl.localib.app)", userAgent);
	}

	[Fact]
	public void TokenRequestHeader_ReturnsOAuthHeaderFormat()
	{
		var service = CreateService(consumerKey: "mykey", consumerSecret: "mysecret");

		string header = service.TokenRequestHeader();

		Assert.StartsWith("OAuth ", header);
		Assert.Contains("oauth_consumer_key=\"mykey\"", header);
		Assert.Contains("oauth_signature=\"mysecret&\"", header);
		Assert.Contains("oauth_signature_method=\"PLAINTEXT\"", header);
	}

	[Fact]
	public void TokenCallbackHeader_ReturnsOAuthHeaderWithTokenAndVerifier()
	{
		var service = CreateService(consumerKey: "mykey", consumerSecret: "mysecret");
		var input = new CallbackInput
		{
			OauthToken = "request_token",
			OauthSecret = "token_secret",
			OauthVerifier = "verifier123"
		};

		string header = service.TokenCallbackHeader(input);

		Assert.StartsWith("OAuth ", header);
		Assert.Contains("oauth_consumer_key=\"mykey\"", header);
		Assert.Contains("oauth_token=\"request_token\"", header);
		Assert.Contains("oauth_verifier=\"verifier123\"", header);
		Assert.Contains("oauth_signature=\"mysecret&token_secret\"", header);
	}

	[Fact]
	public void AuthenticatedRequestHeader_ReturnsOAuthHeaderWithAccessToken()
	{
		var service = CreateService(consumerKey: "mykey", consumerSecret: "mysecret");
		var token = new CallbackToken
		{
			AccessToken = "access_token_value",
			SecretToken = "secret_token_value"
		};

		string header = service.AuthenticatedRequestHeader(token);

		Assert.StartsWith("OAuth ", header);
		Assert.Contains("oauth_consumer_key=\"mykey\"", header);
		Assert.Contains("oauth_token=\"access_token_value\"", header);
		Assert.Contains("oauth_signature=\"mysecret&secret_token_value\"", header);
	}

	[Fact]
	public void ExtractToken_ValidBearerToken_ReturnsCallbackToken()
	{
		var service = CreateService();

		CallbackToken? result = service.ExtractToken("Bearer " + "myaccesstoken" + "&" + "mysecrettoken");

		Assert.NotNull(result);
		Assert.Equal("myaccesstoken", result.AccessToken);
		Assert.Equal("mysecrettoken", result.SecretToken);
	}

	[Fact]
	public void ExtractToken_NullInput_ReturnsNull()
	{
		var service = CreateService();

		CallbackToken? result = service.ExtractToken(null);

		Assert.Null(result);
	}

	[Fact]
	public void ExtractToken_EmptyString_ReturnsNull()
	{
		var service = CreateService();

		CallbackToken? result = service.ExtractToken("");

		Assert.Null(result);
	}

	[Fact]
	public void ExtractToken_MissingBearerPrefix_ReturnsNull()
	{
		var service = CreateService();

		CallbackToken? result = service.ExtractToken("token&secret");

		Assert.Null(result);
	}

	[Fact]
	public void ExtractToken_TokenWithoutAmpersand_ReturnsNull()
	{
		var service = CreateService();

		CallbackToken? result = service.ExtractToken("Bearer " + "tokenonlynosplit");

		Assert.Null(result);
	}

	[Fact]
	public void ExtractToken_BearerCaseInsensitive_ReturnsCallbackToken()
	{
		var service = CreateService();

		CallbackToken? result = service.ExtractToken("BEARER access&secret");

		Assert.NotNull(result);
		Assert.Equal("access", result.AccessToken);
		Assert.Equal("secret", result.SecretToken);
	}

	[Fact]
	public void ExtractToken_TokenWithMultipleAmpersands_SplitsOnFirst()
	{
		var service = CreateService();

		CallbackToken? result = service.ExtractToken("Bearer " + "access" + "&" + "secret&extra");

		Assert.NotNull(result);
		Assert.Equal("access", result.AccessToken);
		Assert.Equal("secret&extra", result.SecretToken);
	}
}
