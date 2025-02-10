using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Web;
using System.Collections.Specialized;

namespace Discapp.API.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class AuthController(IHttpClientFactory httpClientFactory) : ControllerBase
	{
		private const string DiscogsRequestTokenUrl = "https://api.discogs.com/oauth/request_token";
		private const string DiscogsAuthorizeUrl = "https://www.discogs.com/oauth/authorize";
		private const string DiscogsAccessTokenUrl = "https://api.discogs.com/oauth/access_token";

		private const string ConsumerKey = "";
		private const string ConsumerSecret = "";
		private readonly HttpClient _httpClient = httpClientFactory.CreateClient();

		[HttpGet("request-token")]
		public async Task<IActionResult> GetRequestToken()
		{
			string nonce = GenerateNonce();
			string timestamp = GenerateTimestamp();

			string authHeader = $"OAuth " +
							 $"oauth_consumer_key=\"{ConsumerKey}\"," +
							 $"oauth_nonce=\"{nonce}\"," +
							 $"oauth_signature=\"{ConsumerSecret}&\"," +
							 $"oauth_signature_method=\"PLAINTEXT\"," +
							 $"oauth_timestamp=\"{timestamp}\"," +
							 $"oauth_callback=\"http://localhost:3000/callback\"";

			HttpRequestMessage request = new(HttpMethod.Post, DiscogsRequestTokenUrl);
			request.Headers.Add("Authorization", authHeader);
			request.Headers.Add("User-Agent", "LocalibOfflineCollector/0.1 (http://vinyl.localib.app)");
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
							 $"oauth_consumer_key=\"{ConsumerKey}\"," +
							 $"oauth_nonce=\"{nonce}\"," +
							 $"oauth_signature=\"{ConsumerSecret}&\"," +
							 $"oauth_signature_method=\"PLAINTEXT\"," +
							 $"oauth_timestamp=\"{timestamp}\"," +
							 $"oauth_token=\"{oauth_token}\"," +
							 $"oauth_verifier=\"{oauth_verifier}\"";

			HttpRequestMessage request = new(HttpMethod.Post, DiscogsAccessTokenUrl);
			request.Headers.Add("Authorization", authHeader);
			request.Headers.Add("User-Agent", "LocalibOfflineCollector/0.1 (http://vinyl.localib.app)");
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
