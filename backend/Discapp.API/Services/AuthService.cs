using System;
using System.Text;
using Discapp.API.Models;

namespace Discapp.API.Services
{
	public interface IAuthService
	{
		string TokenRequestHeader();
		string TokenCallbackHeader(CallbackInput oauth_details);
		string AuthenticatedRequestHeader(string key, string secret);
		string UserAgent();
	}

	public class AuthService(AuthSettings authSettings) : IAuthService
	{
		private readonly AuthSettings _authSettings = authSettings;

		public string TokenRequestHeader()
		{
			Dictionary<string, string> parameters = new()
			{
				{ "oauth_consumer_key", _authSettings.ConsumerKey },
				{ "oauth_nonce", GenerateNonce() },
				{ "oauth_signature", $"{_authSettings.ConsumerSecret}&" },
				{ "oauth_signature_method", "PLAINTEXT" },
				{ "oauth_timestamp", GenerateTimestamp() },
				{ "oauth_callback", _authSettings.CallbackURL }
			};

			return GenerateHeader(parameters);
		}

		public string TokenCallbackHeader(CallbackInput oauth_details)
		{
			Dictionary<string, string> parameters = new()
			{
				{ "oauth_consumer_key", _authSettings.ConsumerKey },
				{ "oauth_nonce", GenerateNonce() },
				{ "oauth_signature", $"{_authSettings.ConsumerSecret}&{oauth_details.OauthSecret}" },
				{ "oauth_signature_method", "PLAINTEXT" },
				{ "oauth_timestamp", GenerateTimestamp() },
				{ "oauth_token", oauth_details.OauthToken },
				{ "oauth_verifier", oauth_details.OauthVerifier }
			};

			return GenerateHeader(parameters);
		}

		public string AuthenticatedRequestHeader(string key, string secret)
		{
			Dictionary<string, string> parameters = new()
			{
				{ "oauth_consumer_key", _authSettings.ConsumerKey },
				{ "oauth_nonce", GenerateNonce() },
				{ "oauth_signature", $"{_authSettings.ConsumerSecret}&{secret}" },
				{ "oauth_signature_method", "PLAINTEXT" },
				{ "oauth_timestamp", GenerateTimestamp() },
				{ "oauth_token", key }
			};

			return GenerateHeader(parameters);
		}

		public string UserAgent() => "LocalibOfflineCollector/0.1 (https://vinyl.localib.app)";

		private static string GenerateHeader(Dictionary<string, string> parameters)
		{
			StringBuilder headerBuilder = new("OAuth ");

			foreach (KeyValuePair<string, string> parameter in parameters)
			{
				headerBuilder.Append($"{parameter.Key}=\"{parameter.Value}\",");
			}

			if (headerBuilder.Length > 0)
			{
				headerBuilder.Length--;
			}

			return headerBuilder.ToString();
		}


		private static string GenerateNonce() => Guid.NewGuid().ToString("N");

		private static string GenerateTimestamp() => DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
	}
}
