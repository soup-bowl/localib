using System.Text.Json.Serialization;

namespace Discapp.API.Models.Discogs
{
	public class DiscogsRelease
	{
		public int Id { get; set; }
		[JsonPropertyName("master_id")]
		public int MasterId { get; set; }
		[JsonPropertyName("master_url")]
		public string MasterUrl { get; set; } = string.Empty;
		[JsonPropertyName("resource_url")]
		public string ResourceUrl { get; set; } = string.Empty;
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

	public class DiscogsReleaseCollection
	{
		public int Id { get; set; }
		[JsonPropertyName("instance_id")]
		public int InstanceId { get; set; }
		[JsonPropertyName("folder_id")]
		public int FolderId { get; set; }
		[JsonPropertyName("date_added")]
		public DateTime DateAdded { get; set; }
		public int Rating { get; set; }
		[JsonPropertyName("basic_information")]
		public required DiscogsRelease BasicInformation { get; set; }
		public AvailableRecord? Vinyl { get; set; }
	}

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
		[JsonPropertyName("lowest_price")]
		public string Country { get; set; } = string.Empty;
		public string Released { get; set; } = string.Empty;
		public string Notes { get; set; } = string.Empty;
		[JsonPropertyName("released_formatted")]
		public string ReleasedFormatted { get; set; } = string.Empty;
		public List<DiscogsIdentifiers>? Identifiers { get; set; }
		public List<DiscogsTrack>? Tracklist { get; set; }
		[JsonPropertyName("extra_artists")]
		public List<DiscogsArtist>? ExtraArtists { get; set; }
		[JsonPropertyName("estimated_weight")]
		public int EstimatedWeight { get; set; }
		[JsonPropertyName("blocked_from_sale")]
		public bool BlockedFromSale { get; set; }
	}

	public class DiscogsCollectionsReturn
	{
		public required DiscogsPagination Pagination { get; set; }
		public required List<DiscogsReleaseCollection> Releases { get; set; }
	}

	public class DiscogsWantsReturn
	{
		public required DiscogsPagination Pagination { get; set; }
		public required List<DiscogsReleaseCollection> Wants { get; set; }
	}
}