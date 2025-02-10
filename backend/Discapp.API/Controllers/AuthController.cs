using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Web;
using System.Collections.Specialized;
using Discapp.API.Models;

namespace Discapp.API.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class AuthController : ControllerBase
	{
		private const string DiscogsRequestTokenUrl = "https://api.discogs.com/oauth/request_token";
		private const string DiscogsAuthorizeUrl = "https://www.discogs.com/oauth/authorize";
		private const string DiscogsAccessTokenUrl = "https://api.discogs.com/oauth/access_token";

		private readonly HttpClient _httpClient;

		private readonly AuthSettings _authSettings;

		public AuthController(IHttpClientFactory httpClientFactory, AuthSettings authSettings)
		{
			_httpClient = httpClientFactory.CreateClient();
			_authSettings = authSettings;
		}

		[HttpGet("request-token")]
		public async Task<IActionResult> GetRequestToken()
		{
			string nonce = GenerateNonce();
			string timestamp = GenerateTimestamp();

			string authHeader = $"OAuth " +
							 $"oauth_consumer_key=\"{_authSettings.ConsumerKey}\"," +
							 $"oauth_nonce=\"{nonce}\"," +
							 $"oauth_signature=\"{_authSettings.ConsumerSecret}&\"," +
							 $"oauth_signature_method=\"PLAINTEXT\"," +
							 $"oauth_timestamp=\"{timestamp}\"," +
							 $"oauth_callback=\"{_authSettings.CallbackURL}\"";

			HttpRequestMessage request = new(HttpMethod.Get, DiscogsRequestTokenUrl);
			request.Headers.Add("Authorization", authHeader);
			request.Headers.Add("User-Agent", "LocalibOfflineCollector/0.1 (https://vinyl.localib.app)");
			request.Content = new StringContent("", Encoding.UTF8, "application/x-www-form-urlencoded");

			HttpResponseMessage response = await _httpClient.SendAsync(request);
			string responseContent = await response.Content.ReadAsStringAsync();

			if (!response.IsSuccessStatusCode)
				return BadRequest($"Failed to get request token. Status: {response.StatusCode}, Content: {responseContent}");

			NameValueCollection query = HttpUtility.ParseQueryString(responseContent);
			string? oauthToken = query["oauth_token"];
			string? oauthTokenSecret = query["oauth_token_secret"];

			return Ok(new { redirectUrl = $"{DiscogsAuthorizeUrl}?oauth_token={oauthToken}" });
		}


		[HttpGet("callback")]
		public async Task<IActionResult> HandleCallback([FromQuery] string oauth_token, [FromQuery] string oauth_verifier)
		{
			string nonce = GenerateNonce();
			string timestamp = GenerateTimestamp();

			string authHeader = $"OAuth " +
							 $"oauth_consumer_key=\"{_authSettings.ConsumerKey}\"," +
							 $"oauth_nonce=\"{nonce}\"," +
							 $"oauth_signature=\"{_authSettings.ConsumerSecret}&\"," +
							 $"oauth_signature_method=\"PLAINTEXT\"," +
							 $"oauth_timestamp=\"{timestamp}\"," +
							 $"oauth_token=\"{oauth_token}\"," +
							 $"oauth_verifier=\"{oauth_verifier}\"";

			HttpRequestMessage request = new(HttpMethod.Post, DiscogsAccessTokenUrl);
			request.Headers.Add("Authorization", authHeader);
			request.Headers.Add("User-Agent", "LocalibOfflineCollector/0.1 (https://vinyl.localib.app)");
			request.Content = new StringContent("", Encoding.UTF8, "application/x-www-form-urlencoded");

			HttpResponseMessage response = await _httpClient.SendAsync(request);
			string responseContent = await response.Content.ReadAsStringAsync();

			if (!response.IsSuccessStatusCode)
				return BadRequest($"Failed to get access token. Status: {response.StatusCode}, Content: {responseContent}");

			NameValueCollection query = HttpUtility.ParseQueryString(responseContent);
			string? accessToken = query["oauth_token"];
			string? accessTokenSecret = query["oauth_token_secret"];

			return Ok(new { accessToken, accessTokenSecret });
		}

		private static string GenerateNonce() => Guid.NewGuid().ToString("N");

		private static string GenerateTimestamp() => DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
	}
}
