namespace Discapp.API.Models.Discogs
{
	public class DiscogsPagination
	{
		public int Page { get; set; }
		public int Pages { get; set; }
		public int PerPage { get; set; }
		public int Items { get; set; }
		public required DiscogsUrls Urls { get; set; }
	}

	public class DiscogsUrls
	{
		public string First { get; set; } = string.Empty;
		public string Last { get; set; } = string.Empty;
		public string Prev { get; set; } = string.Empty;
		public string Next { get; set; } = string.Empty;
	}
}
