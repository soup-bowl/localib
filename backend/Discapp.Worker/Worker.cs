using DiscappAPI.Data;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MySql.Data.MySqlClient;
using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace Discapp.Worker;

public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    private readonly IServiceScopeFactory _scope;

    public Worker(ILogger<Worker> logger, IServiceScopeFactory scope)
    {
        _logger = logger;
        _scope = scope;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            if (_logger.IsEnabled(LogLevel.Information))
            {
                _logger.LogInformation("Worker running at: {time}", DateTimeOffset.Now);

                using IServiceScope scope = _scope.CreateScope();

                ApplicationDbContext dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                Queue? queueItem = await dbContext.Queue.FirstOrDefaultAsync(stoppingToken);

                if (queueItem != null)
                {
                    _logger.LogInformation("Spotted " + queueItem.RecordID.ToString());
                }
            }
            await Task.Delay(1000, stoppingToken);
        }
    }
}
