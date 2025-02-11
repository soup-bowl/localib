namespace Discapp.API.Models
{
	public class CollectionControls
	{
		public string Type { get; set; } = "release";
		public int Page { get; set; } = 1;
		public int PerPage { get; set; } = 100;
	}
}
