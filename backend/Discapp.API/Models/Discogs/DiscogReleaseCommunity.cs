namespace Discapp.API.Models.Discogs
{
	public class DiscogReleaseCommunity
	{
		public int Have { get; set; }
		public int Want { get; set; }
		public DiscogsRating? Rating { get; set; }
		public DiscogsCommitter? Submitter { get; set; }
		public List<DiscogsCommitter>? Contributors { get; set; }
		public string DataQuality { get; set; } = string.Empty;
		public string Status { get; set; } = string.Empty;
	}
}