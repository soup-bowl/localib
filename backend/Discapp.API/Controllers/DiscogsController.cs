using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using Discapp.API.Models;
using Discapp.API.Models.Discogs;
using Discapp.API.Models.Auth;
using Discapp.API.Services;

namespace Discapp.API.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class DiscogsController(IHttpClientFactory httpClientFactory, IAuthService authService, IImageProcessService imageService) : ControllerBase
	{
		private const string DiscogsBaseURL = "https://api.discogs.com";
		private readonly HttpClient _httpClient = httpClientFactory.CreateClient();
		private readonly IAuthService _authService = authService;
		private readonly IImageProcessService _imageService = imageService;

		[HttpGet("Identify")]
		public Task<ActionResult<DiscogsIdentity>> GetIdentity([FromHeader(Name = "Authorization")] string token) =>
			SendDiscogsRequestAsync<DiscogsIdentity>("oauth/identity", _authService.ExtractToken(token));

		[HttpGet("Profile")]
		public Task<ActionResult<DiscogsProfile>> GetProfile([FromQuery] string username, [FromHeader(Name = "Authorization")] string token) =>
			SendDiscogsRequestAsync<DiscogsProfile>($"users/{username}", _authService.ExtractToken(token), async data =>
			{
				try
				{
					byte[] imageBytes = await _httpClient.GetByteArrayAsync(data.AvatarUrl);
					data.AvatarBase64 = $"data:jpeg;base64,{Convert.ToBase64String(imageBytes)}";
				}
				catch (HttpRequestException ex)
				{
					Console.WriteLine($"Failed to fetch avatar for User ID {data.Id}: {ex.Message}");
					data.AvatarBase64 = null;
				}

				try
				{
					byte[] imageBytes = await _httpClient.GetByteArrayAsync(data.BannerUrl);
					data.BannerBase64 = $"data:jpeg;base64,{Convert.ToBase64String(imageBytes)}";
				}
				catch (HttpRequestException ex)
				{
					Console.WriteLine($"Failed to fetch banner for User ID {data.Id}: {ex.Message}");
					data.BannerBase64 = null;
				}

				return data;
			});

		[HttpGet("Release")]
		public Task<ActionResult<DiscogsReleaseExtended>> GetRelease([FromQuery] int id, [FromHeader(Name = "Authorization")] string token) =>
			SendDiscogsRequestAsync<DiscogsReleaseExtended>($"releases/{id}", _authService.ExtractToken(token));

		[HttpGet("Collections")]
		public Task<ActionResult<DiscogsCollectionsReturn>> GetCollections([FromQuery] string username, [FromHeader(Name = "Authorization")] string token, [FromQuery] CollectionControls controls) =>
			SendDiscogsRequestAsync<DiscogsCollectionsReturn>($"users/{username}/collection/folders/0/releases?page={controls.Page}&per_page={controls.PerPage}", _authService.ExtractToken(token), async data =>
			{
				var updateDict = (await _imageService.PostMyEntity(
					[.. data.Releases.Select(release => release.Id)])
				).Available.ToDictionary(x => x.RecordID);

				data.Releases.ForEach(item =>
					item.Vinyl = updateDict.GetValueOrDefault(item.Id));

				return data;
			});

		[HttpGet("Wants")]
		public Task<ActionResult<DiscogsWantsReturn>> GetWants([FromQuery] string username, [FromHeader(Name = "Authorization")] string token, [FromQuery] CollectionControls controls) =>
			SendDiscogsRequestAsync<DiscogsWantsReturn>($"users/{username}/wants?page={controls.Page}&per_page={controls.PerPage}", _authService.ExtractToken(token), async data =>
			{
				var updateDict = (await _imageService.PostMyEntity(
					[.. data.Wants.Select(release => release.Id)])
				).Available.ToDictionary(x => x.RecordID);

				data.Wants.ForEach(item =>
					item.Vinyl = updateDict.GetValueOrDefault(item.Id));

				return data;
			});

		private async Task<ActionResult<T>> SendDiscogsRequestAsync<T>(string endpoint, CallbackToken? token, Func<T, Task<T>>? onResultProcessed = null) where T : class
		{
			if (token is null)
				return BadRequest("Invalid token.");

			HttpRequestMessage request = new(HttpMethod.Get, $"{DiscogsBaseURL}/{endpoint}");
			request.Headers.Add("Authorization", _authService.AuthenticatedRequestHeader(token));
			request.Headers.Add("User-Agent", _authService.UserAgent());

			HttpResponseMessage response = await _httpClient.SendAsync(request);
			string content = await response.Content.ReadAsStringAsync();

			if (!response.IsSuccessStatusCode)
				return BadRequest(new
				{
					code = response.StatusCode,
					message = content
				});

			T? result = JsonSerializer.Deserialize<T>(content, s_exportDiscogsData);

			if (result is not null && onResultProcessed is not null)
			{
				result = await onResultProcessed(result);
			}

			return result is not null ? Ok(result) : BadRequest(new { message = "Failed to parse response." });
		}

		private static readonly JsonSerializerOptions s_exportDiscogsData = new()
		{
			PropertyNameCaseInsensitive = true
		};
	}
}
