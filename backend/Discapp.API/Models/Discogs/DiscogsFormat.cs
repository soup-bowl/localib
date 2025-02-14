namespace Discapp.API.Models.Discogs
{
	public class DiscogsFormat
	{
		public string Name { get; set; } = string.Empty;
		public string Qty { get; set; } = string.Empty;
		public List<string>? Descriptions { get; set; }
	}
}
