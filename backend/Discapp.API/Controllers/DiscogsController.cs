using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Web;
using System.Collections.Specialized;
using Discapp.API.Models;
using Discapp.API.Services;

namespace Discapp.API.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class DiscogsController(IHttpClientFactory httpClientFactory, IAuthService authService) : ControllerBase
	{
		private const string DiscogsBaseURL = "https://api.discogs.com";
		private readonly HttpClient _httpClient = httpClientFactory.CreateClient();

		private readonly IAuthService _authService = authService;

		[HttpGet("Identify")]
		public async Task<ActionResult<AuthToken>> GetIdentity([FromQuery] CallbackToken token)
		{
			HttpRequestMessage request = new(HttpMethod.Get, $"{DiscogsBaseURL}/oauth/identity");
			request.Headers.Add("Authorization", _authService.AuthenticatedRequestHeader(token));
			request.Headers.Add("User-Agent", _authService.UserAgent());
			request.Content = new StringContent("", Encoding.UTF8, "application/x-www-form-urlencoded");

			HttpResponseMessage response = await _httpClient.SendAsync(request);
			string responseContent = await response.Content.ReadAsStringAsync();

			if (!response.IsSuccessStatusCode)
				return BadRequest($"Failed to get request token. Status: {response.StatusCode}, Content: {responseContent}");

			return StatusCode((int)response.StatusCode, responseContent);
		}

		[HttpGet("Profile")]
		public async Task<ActionResult<AuthToken>> GetProfile([FromQuery] string username, [FromQuery] CallbackToken token)
		{
			HttpRequestMessage request = new(HttpMethod.Get, $"{DiscogsBaseURL}/users/{username}");
			request.Headers.Add("Authorization", _authService.AuthenticatedRequestHeader(token));
			request.Headers.Add("User-Agent", _authService.UserAgent());
			request.Content = new StringContent("", Encoding.UTF8, "application/x-www-form-urlencoded");

			HttpResponseMessage response = await _httpClient.SendAsync(request);
			string responseContent = await response.Content.ReadAsStringAsync();

			if (!response.IsSuccessStatusCode)
				return BadRequest($"Failed to get request token. Status: {response.StatusCode}, Content: {responseContent}");

			return StatusCode((int)response.StatusCode, responseContent);
		}

		[HttpGet("Collection")]
		public async Task<ActionResult<AuthToken>> GetProfile([FromQuery] string username, [FromQuery] CallbackToken token, [FromQuery] CollectionControls controls)
		{
			if (controls.Type != "collection" && controls.Type != "want")
				return BadRequest("Invalid type. Must be 'collection' or 'want'.");

			string requestBase = (controls.Type == "collection") ?
				$"{DiscogsBaseURL}/users/{username}/collection/folders/0/releases" :
				$"{DiscogsBaseURL}/users/{username}/wants";
			string requestControls = $"?page={controls.Page}&per_page={controls.PerPage}";
			HttpRequestMessage request = new(HttpMethod.Get, $"{requestBase}{requestControls}");
			request.Headers.Add("Authorization", _authService.AuthenticatedRequestHeader(token));
			request.Headers.Add("User-Agent", _authService.UserAgent());
			request.Content = new StringContent("", Encoding.UTF8, "application/x-www-form-urlencoded");

			HttpResponseMessage response = await _httpClient.SendAsync(request);
			string responseContent = await response.Content.ReadAsStringAsync();

			if (!response.IsSuccessStatusCode)
				return BadRequest($"Failed to get request token. Status: {response.StatusCode}, Content: {responseContent}");

			return StatusCode((int)response.StatusCode, responseContent);
		}
	}
}
