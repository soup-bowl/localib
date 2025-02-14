namespace Discapp.API.Models.Auth
{
	public class AuthToken
	{
		public string RedirectUrl { get; set; } = "";
		public string TokenSecret { get; set; } = "";
	}
}
