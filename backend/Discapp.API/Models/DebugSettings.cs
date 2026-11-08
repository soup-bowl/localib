namespace Discapp.API.Models
{
	public class DebugSettings
	{
		/// <summary>
		/// Enables the /api/Debug endpoints. Off by default, as they trigger Discogs requests with the server's key.
		/// </summary>
		public bool Enabled { get; set; }
	}
}
