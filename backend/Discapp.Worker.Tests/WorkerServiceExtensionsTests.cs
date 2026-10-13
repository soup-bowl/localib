using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Discapp.Worker.Models;

namespace Discapp.Worker.Tests;

public class WorkerServiceExtensionsTests
{
	[Theory]
	[InlineData(null, true)]
	[InlineData("", true)]
	[InlineData("true", true)]
	[InlineData("1", true)]
	[InlineData("false", false)]
	[InlineData("FALSE", false)]
	[InlineData(" false ", false)]
	[InlineData("0", false)]
	public void IsWorkerEnabled_InterpretsValue(string? value, bool expected)
	{
		Assert.Equal(expected, WorkerServiceExtensions.IsWorkerEnabled(value));
	}

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

public class WorkerExecuteTests
{
	[Fact]
	public async Task ExecuteAsync_IterationThrows_KeepsRunning()
	{
		int attempts = 0;
		var scopeFactory = new Mock<IServiceScopeFactory>();
		scopeFactory.Setup(f => f.CreateScope()).Returns(() =>
		{
			Interlocked.Increment(ref attempts);
			throw new InvalidOperationException("Database unavailable");
		});

		var pathOptions = new Mock<IOptions<PathSettings>>();
		pathOptions.Setup(p => p.Value).Returns(new PathSettings { ImagePath = Path.GetTempPath() });

		var httpClientFactory = new Mock<IHttpClientFactory>();
		httpClientFactory.Setup(f => f.CreateClient("Discogs")).Returns(new HttpClient());

		var worker = new Worker(new Mock<ILogger<Worker>>().Object, scopeFactory.Object, pathOptions.Object, httpClientFactory.Object);

		await worker.StartAsync(CancellationToken.None);
		await Task.Delay(1500);

		Assert.NotNull(worker.ExecuteTask);
		Assert.False(worker.ExecuteTask.IsFaulted);
		Assert.True(attempts >= 2);

		await worker.StopAsync(CancellationToken.None);
	}
}
