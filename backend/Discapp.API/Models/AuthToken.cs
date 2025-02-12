namespace Discapp.API.Models
{
	public class AuthToken
	{
		public string RedirectUrl { get; set; } = "";
		public string TokenSecret { get; set; } = "";
	}
}
