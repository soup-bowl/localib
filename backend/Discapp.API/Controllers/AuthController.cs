using Discapp.Shared.Data;
using Discapp.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Web;
using System.Linq;

namespace Discapp.API.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class AuthController : ControllerBase
	{
		private const string DiscogsRequestTokenUrl = "https://api.discogs.com/oauth/request_token";
		private const string DiscogsAuthorizeUrl = "https://www.discogs.com/oauth/authorize";
		private const string DiscogsAccessTokenUrl = "https://api.discogs.com/oauth/access_token";

		private const string ConsumerKey = "";
		private const string ConsumerSecret = "";
		private readonly HttpClient _httpClient;

		public AuthController(IHttpClientFactory httpClientFactory)
		{
			_httpClient = httpClientFactory.CreateClient();
		}

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

			var request = new HttpRequestMessage(HttpMethod.Post, DiscogsRequestTokenUrl);
			request.Headers.Add("Authorization", authHeader);
			request.Headers.Add("User-Agent", "LocalibOfflineCollector/0.1 (http://vinyl.localib.app)");
			request.Content = new StringContent("", Encoding.UTF8, "application/x-www-form-urlencoded");

			var response = await _httpClient.SendAsync(request);
			var responseContent = await response.Content.ReadAsStringAsync();

			if (!response.IsSuccessStatusCode)
				return BadRequest($"Failed to get request token. Status: {response.StatusCode}, Content: {responseContent}");

			var query = HttpUtility.ParseQueryString(responseContent);
			var oauthToken = query["oauth_token"];
			var oauthTokenSecret = query["oauth_token_secret"];

			return Ok(new { redirectUrl = $"{DiscogsAuthorizeUrl}?oauth_token={oauthToken}" });
		}


		[HttpGet("callback")]
		public async Task<IActionResult> HandleCallback([FromQuery] string oauth_token, [FromQuery] string oauth_verifier)
		{
			var nonce = GenerateNonce();
			var timestamp = GenerateTimestamp();

			var authHeader = $"OAuth " +
							 $"oauth_consumer_key=\"{ConsumerKey}\"," +
							 $"oauth_nonce=\"{nonce}\"," +
							 $"oauth_signature=\"{ConsumerSecret}&\"," +
							 $"oauth_signature_method=\"PLAINTEXT\"," +
							 $"oauth_timestamp=\"{timestamp}\"," +
							 $"oauth_token=\"{oauth_token}\"," +
							 $"oauth_verifier=\"{oauth_verifier}\"";

			var request = new HttpRequestMessage(HttpMethod.Post, DiscogsAccessTokenUrl);
			request.Headers.Add("Authorization", authHeader);
			request.Headers.Add("User-Agent", "LocalibOfflineCollector/0.1 (http://vinyl.localib.app)");
			request.Content = new StringContent("", Encoding.UTF8, "application/x-www-form-urlencoded");

			var response = await _httpClient.SendAsync(request);
			var responseContent = await response.Content.ReadAsStringAsync();

			if (!response.IsSuccessStatusCode)
				return BadRequest($"Failed to get access token. Status: {response.StatusCode}, Content: {responseContent}");

			var query = HttpUtility.ParseQueryString(responseContent);
			var accessToken = query["oauth_token"];
			var accessTokenSecret = query["oauth_token_secret"];

			return Ok(new { accessToken, accessTokenSecret });
		}



		private static string GenerateNonce() => Guid.NewGuid().ToString("N");

		private static string GenerateTimestamp() => DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();

		private static string GenerateSignature(string baseString, string consumerSecret)
		{
			using var hmac = new HMACSHA1(Encoding.ASCII.GetBytes($"{consumerSecret}&"));
			var hashBytes = hmac.ComputeHash(Encoding.ASCII.GetBytes(baseString));
			return Convert.ToBase64String(hashBytes);
		}

		private static string UrlEncode(string value)
		{
			return HttpUtility.UrlEncode(value)
				.Replace("+", "%20")
				.Replace("*", "%2A")
				.Replace("%7E", "~");
		}
	}
}
