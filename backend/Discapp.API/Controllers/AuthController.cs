using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.Text;
using System.Web;
using System.Collections.Specialized;
using Discapp.API.Models.Auth;
using Discapp.API.Services;
using Discapp.Shared.Models;

namespace Discapp.API.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class AuthController(IHttpClientFactory httpClientFactory, IAuthService authService, IOptions<DiscogApiSettings> discogSettings) : ControllerBase
	{
		private readonly HttpClient _httpClient = httpClientFactory.CreateClient();
		private readonly IAuthService _authService = authService;
		private readonly DiscogApiSettings _discogSettings = discogSettings.Value;

		[HttpGet("Token")]
		public async Task<ActionResult<AuthToken>> GetRequestToken()
		{
			HttpRequestMessage request = new(HttpMethod.Get, _discogSettings.RequestTokenUrl);
			request.Headers.Add("Authorization", _authService.TokenRequestHeader());
			request.Headers.Add("User-Agent", _authService.UserAgent());
			request.Content = new StringContent("", Encoding.UTF8, "application/x-www-form-urlencoded");

			HttpResponseMessage response = await _httpClient.SendAsync(request);
			string responseContent = await response.Content.ReadAsStringAsync();

			if (!response.IsSuccessStatusCode)
				return BadRequest($"Failed to get request token. Status: {response.StatusCode}, Content: {responseContent}");

			NameValueCollection query = HttpUtility.ParseQueryString(responseContent);
			string? oauthToken = query["oauth_token"];
			string? oauthTokenSecret = query["oauth_token_secret"];

			return Ok(new AuthToken
			{
				RedirectUrl = $"{_discogSettings.AuthorizeUrl}?oauth_token={oauthToken}",
				TokenSecret = oauthTokenSecret ?? ""
			});
		}


		[HttpGet("Callback")]
		public async Task<ActionResult<CallbackToken>> HandleCallback([FromQuery] CallbackInput oauth_details)
		{
			HttpRequestMessage request = new(HttpMethod.Post, _discogSettings.AccessTokenUrl);
			request.Headers.Add("Authorization", _authService.TokenCallbackHeader(oauth_details));
			request.Headers.Add("User-Agent", _authService.UserAgent());
			request.Content = new StringContent("", Encoding.UTF8, "application/x-www-form-urlencoded");

			HttpResponseMessage response = await _httpClient.SendAsync(request);
			string responseContent = await response.Content.ReadAsStringAsync();

			if (!response.IsSuccessStatusCode)
				return BadRequest($"Failed to get access token. Status: {response.StatusCode}, Content: {responseContent}");

			NameValueCollection query = HttpUtility.ParseQueryString(responseContent);
			string? accessToken = query["oauth_token"];
			string? accessTokenSecret = query["oauth_token_secret"];

			return Ok(new CallbackToken
			{
				AccessToken = accessToken ?? "",
				SecretToken = accessTokenSecret ?? ""
			});
		}
	}
}
