using System.Text.Json.Serialization;

namespace Discapp.API.Models.Discogs
{
	public class DiscogsReleaseExtended : DiscogsRelease
	{
		public string Status { get; set; } = string.Empty;
		public string Uri { get; set; } = string.Empty;
		[JsonPropertyName("artists_sort")]
		public string ArtistsSort { get; set; } = string.Empty;
		[JsonPropertyName("data_quality")]
		public string DataQuality { get; set; } = string.Empty;
		public DiscogReleaseCommunity? Community { get; set; }
		[JsonPropertyName("format_quantity")]
		public int FormatQuantity { get; set; }
		[JsonPropertyName("date_added")]
		public string DateAdded { get; set; } = string.Empty;
		[JsonPropertyName("date_changed")]
		public string DateChanged { get; set; } = string.Empty;
		[JsonPropertyName("num_for_sale")]
		public int NumForSale { get; set; }
		public string Country { get; set; } = string.Empty;
		public string Released { get; set; } = string.Empty;
		public string Notes { get; set; } = string.Empty;
		[JsonPropertyName("released_formatted")]
		public string ReleasedFormatted { get; set; } = string.Empty;
		public List<DiscogsIdentifiers>? Identifiers { get; set; }
		public List<DiscogsTrack>? Tracklist { get; set; }
		[JsonPropertyName("extraartists")]
		public List<DiscogsArtist>? ExtraArtists { get; set; }
		[JsonPropertyName("estimated_weight")]
		public int EstimatedWeight { get; set; }
		[JsonPropertyName("blocked_from_sale")]
		public bool BlockedFromSale { get; set; }
	}
}