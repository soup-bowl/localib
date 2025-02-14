using System.Text.Json.Serialization;

namespace Discapp.API.Models.Discogs
{
	public class DiscogsArtist
	{
		public int Id { get; set; }
		[JsonPropertyName("resource_url")]
		public string ResourceUrl { get; set; } = string.Empty;
		public string Name { get; set; } = string.Empty;
		public string Anv { get; set; } = string.Empty;
		public string Join { get; set; } = string.Empty;
		public string Role { get; set; } = string.Empty;
		public string Tracks { get; set; } = string.Empty;
	}
}
