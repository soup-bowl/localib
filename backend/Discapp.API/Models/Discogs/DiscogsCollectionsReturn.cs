namespace Discapp.API.Models.Discogs
{
	public class DiscogsCollectionsReturn
	{
		public required DiscogsPagination Pagination { get; set; }
		public required List<DiscogsReleaseCollection> Releases { get; set; }
	}
}