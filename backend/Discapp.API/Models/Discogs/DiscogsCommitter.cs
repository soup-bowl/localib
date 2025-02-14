using System.Text.Json.Serialization;

namespace Discapp.API.Models.Discogs
{
	public class DiscogsCommitter
	{
		public string Username { get; set; } = string.Empty;
		[JsonPropertyName("resource_url")]
		public string ResourceUrl { get; set; } = string.Empty;
	}
}