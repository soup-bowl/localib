namespace Discapp.API.Models.Discogs
{
	public class DiscogsPagination
	{
		public int Page { get; set; }
		public int Pages { get; set; }
		public int PerPage { get; set; }
		public int Items { get; set; }
		public required DiscogsPaginationUrls Urls { get; set; }
	}
}
