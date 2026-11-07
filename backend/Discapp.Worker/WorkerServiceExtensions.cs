using Discapp.Worker.Models;
using Microsoft.Extensions.DependencyInjection;

namespace Discapp.Worker;

public static class WorkerServiceExtensions
{
	/// <summary>
	/// Registers the artwork Worker as a hosted service. Expects an ApplicationDbContext to already be registered.
	/// </summary>
	public static IServiceCollection AddLocalibWorker(this IServiceCollection services, string imagePath, string consumerKey, string consumerSecret)
	{
		services.Configure<DiscogsOptions>(options =>
		{
			options.ConsumerKey = consumerKey;
			options.ConsumerSecret = consumerSecret;
		});
		services.Configure<PathSettings>(options =>
		{
			options.ImagePath = imagePath;
		});
		services.AddHttpClient("Discogs", (sp, client) =>
		{
			client.BaseAddress = new Uri("https://api.discogs.com");
			client.DefaultRequestHeaders.Add("User-Agent", "DiscappWorker/1.0");
			// Unvalidated, so empty credentials do not stop the host from starting.
			client.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", $"Discogs key={consumerKey}, secret={consumerSecret}");
		});
		services.AddHostedService<Worker>();

		return services;
	}
}
