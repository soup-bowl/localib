namespace Discapp.API.Models.Discogs
{
	public class DiscogsWantsReturn
	{
		public required DiscogsPagination Pagination { get; set; }
		public required List<DiscogsReleaseCollection> Wants { get; set; }
	}
}