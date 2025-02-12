namespace Discapp.API.Models
{
	public class CallbackInput
	{
		public string OauthToken { get; set; } = "";
		public string OauthSecret { get; set; } = "";
		public string OauthVerifier { get; set; } = "";
	}
}
