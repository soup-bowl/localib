using System.Text.Json.Serialization;

namespace Discapp.API.Models.Discogs
{
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
}
