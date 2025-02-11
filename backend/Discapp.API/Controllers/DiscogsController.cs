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
		public async Task<ActionResult<AuthToken>> GetIdentity([FromQuery] string key, [FromQuery] string secret)
		{
			HttpRequestMessage request = new(HttpMethod.Get, $"{DiscogsBaseURL}/oauth/identity");
			request.Headers.Add("Authorization", _authService.AuthenticatedRequestHeader(key, secret));
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
