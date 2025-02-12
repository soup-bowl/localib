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
		public Task<ActionResult<string>> GetIdentity([FromQuery] CallbackToken token) =>
			SendDiscogsRequestAsync("oauth/identity", token);

		[HttpGet("Profile")]
		public Task<ActionResult<string>> GetProfile([FromQuery] string username, [FromQuery] CallbackToken token) =>
			SendDiscogsRequestAsync($"users/{username}", token);

		[HttpGet("Release")]
		public Task<ActionResult<string>> GetRelease([FromQuery] int id, [FromQuery] CallbackToken token) =>
			SendDiscogsRequestAsync($"releases/{id}", token);

		[HttpGet("Collection")]
		public Task<ActionResult<string>> GetCollection([FromQuery] string username, [FromQuery] CallbackToken token, [FromQuery] CollectionControls controls)
		{
			if (controls.Type is not ("collection" or "want"))
				return Task.FromResult<ActionResult<string>>(BadRequest("Invalid type. Must be 'collection' or 'want'."));

			string endpoint = controls.Type == "collection"
				? $"users/{username}/collection/folders/0/releases?page={controls.Page}&per_page={controls.PerPage}"
				: $"users/{username}/wants?page={controls.Page}&per_page={controls.PerPage}";

			return SendDiscogsRequestAsync(endpoint, token);
		}

		private async Task<ActionResult<string>> SendDiscogsRequestAsync(string endpoint, CallbackToken token)
		{
			HttpRequestMessage request = new(HttpMethod.Get, $"{DiscogsBaseURL}/{endpoint}");
			request.Headers.Add("Authorization", _authService.AuthenticatedRequestHeader(token));
			request.Headers.Add("User-Agent", _authService.UserAgent());

			HttpResponseMessage response = await _httpClient.SendAsync(request);
			string content = await response.Content.ReadAsStringAsync();

			return response.IsSuccessStatusCode
				? StatusCode((int)response.StatusCode, content)
				: BadRequest($"Request failed: {response.StatusCode}, Content: {content}");
		}
	}
}
