using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Discapp.Worker.Models;

namespace Discapp.Worker.Tests;

public class WorkerServiceExtensionsTests
{
	[Fact]
	public void AddLocalibWorker_RegistersHostedWorker()
	{
		var services = new ServiceCollection();
		services.AddLogging();

		services.AddLocalibWorker("/images", "key", "secret");

		Assert.Contains(services, d => d.ServiceType == typeof(IHostedService) && d.ImplementationType == typeof(Worker));

		using ServiceProvider provider = services.BuildServiceProvider();
		Assert.Equal("/images", provider.GetRequiredService<IOptions<PathSettings>>().Value.ImagePath);
		Assert.Equal("https://api.discogs.com/", provider.GetRequiredService<IHttpClientFactory>().CreateClient("Discogs").BaseAddress?.ToString());
	}
}
