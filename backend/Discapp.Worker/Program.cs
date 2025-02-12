using Discapp.Worker;
using Discapp.Worker.Models;
using Discapp.Shared.Data;
using Microsoft.EntityFrameworkCore;

var builder = Host.CreateApplicationBuilder(args);

builder.Configuration
       .AddEnvironmentVariables()
       .AddJsonFile("appsettings.Development.json", optional: true, reloadOnChange: true);

var configuration = builder.Configuration;

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString))
);

builder.Services.Configure<DiscogsOptions>(configuration.GetSection("Discogs"));
builder.Services.Configure<PathSettings>(configuration.GetSection("PathSettings"));
builder.Services.AddHostedService<Worker>();

var host = builder.Build();
host.Run();
