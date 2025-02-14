namespace Discapp.API.Models.Auth
{
	public class CallbackToken
	{
		public string AccessToken { get; set; } = "";
		public string SecretToken { get; set; } = "";
	}
}
