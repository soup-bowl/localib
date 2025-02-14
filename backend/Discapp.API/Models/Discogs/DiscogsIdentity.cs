using System.Text.Json.Serialization;

namespace Discapp.API.Models.Discogs
{
	public class DiscogsIdentity
	{
		public int Id { get; set; }
		public string Username { get; set; } = string.Empty;
		[JsonPropertyName("resource_url")]
		public string ResourceUrl { get; set; } = string.Empty;
		[JsonPropertyName("consumer_name")]
		public string ConsumerName { get; set; } = string.Empty;
	}
}
