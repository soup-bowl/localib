using System.Text.Json.Serialization;

namespace Discapp.API.Models.Discogs
{
	public class DiscogsRelease
	{
		public int Id { get; set; }
		[JsonPropertyName("master_id")]
		public int MasterId { get; set; }
		public string Thumb { get; set; } = string.Empty;
		[JsonPropertyName("cover_image")]
		public string CoverImage { get; set; } = string.Empty;
		public string Title { get; set; } = string.Empty;
		public int Year { get; set; }
		public List<DiscogsFormat>? Formats { get; set; }
		public List<DiscogsArtist>? Artists { get; set; }
		public List<DiscogsLabel>? Labels { get; set; }
		public List<string>? Genres { get; set; }
		public List<string>? Styles { get; set; }
	}
}
