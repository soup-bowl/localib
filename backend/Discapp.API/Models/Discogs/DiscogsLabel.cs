using System.Text.Json.Serialization;

namespace Discapp.API.Models.Discogs
{
	public class DiscogsLabel
	{
		public int Id { get; set; }
		[JsonPropertyName("resource_url")]
		public string ResourceUrl { get; set; } = string.Empty;
		public string Name { get; set; } = string.Empty;
		public string Catno { get; set; } = string.Empty;
		[JsonPropertyName("entity_type")]
		public string EntityType { get; set; } = string.Empty;
		[JsonPropertyName("entity_type_name")]
		public string EntityTypeName { get; set; } = string.Empty;
	}
}
