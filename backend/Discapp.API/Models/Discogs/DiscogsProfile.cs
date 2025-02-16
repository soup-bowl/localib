using System.Text.Json.Serialization;

namespace Discapp.API.Models.Discogs
{
	public class DiscogsProfile
	{
		public int Id { get; set; }
		[JsonPropertyName("email")]
		public string Email { get; set; } = string.Empty;
		[JsonPropertyName("uri")]
		public string Uri { get; set; } = string.Empty;
		[JsonPropertyName("profile")]
		public string Profile { get; set; } = string.Empty;
		[JsonPropertyName("home_page")]
		public string HomePage { get; set; } = string.Empty;
		[JsonPropertyName("location")]
		public string Location { get; set; } = string.Empty;
		[JsonPropertyName("registered")]
		public string Registered { get; set; } = string.Empty;
		[JsonPropertyName("num_lists")]
		public int NumLists { get; set; }
		[JsonPropertyName("num_for_sale")]
		public int NumForSale { get; set; }
		[JsonPropertyName("num_collection")]
		public int NumCollection { get; set; }
		[JsonPropertyName("num_wantlist")]
		public int NumWantlist { get; set; }
		[JsonPropertyName("num_pending")]
		public int NumPending { get; set; }
		[JsonPropertyName("releases_contributed")]
		public int ReleasesContributed { get; set; }
		[JsonPropertyName("rank")]
		public double Rank { get; set; }
		[JsonPropertyName("releases_rated")]
		public double ReleasesRated { get; set; }
		[JsonPropertyName("rating_avg")]
		public double RatingAvg { get; set; }
		[JsonPropertyName("avatar_url")]
		public string AvatarUrl { get; set; } = string.Empty;
		[JsonPropertyName("banner_url")]
		public string BannerUrl { get; set; } = string.Empty;
		[JsonPropertyName("avatar_base64")]
		public string? AvatarBase64 { get; set; }
		public string? BannerBase64 { get; set; }
	}
}
