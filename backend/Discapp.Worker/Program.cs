using Discapp.Worker;
using Discapp.Worker.Models;
using Discapp.Shared.Data;
using Microsoft.EntityFrameworkCore;

var builder = Host.CreateApplicationBuilder(args);

var connectionString = Environment.GetEnvironmentVariable("LOCALIB_CONNECTION_STRING");
var imageStoragePath = Environment.GetEnvironmentVariable("LOCALIB_IMAGE_PATH") ?? ".";
var ClientKey = Environment.GetEnvironmentVariable("LOCALIB_DISCOGS_CONSUMER_KEY") ?? "";
var ClientSecret = Environment.GetEnvironmentVariable("LOCALIB_DISCOGS_CONSUMER_SECRET") ?? "";

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString))
);

builder.Services.Configure<DiscogsOptions>(options =>
{
    options.ConsumerKey = ClientKey;
    options.ConsumerSecret = ClientSecret;
});
builder.Services.Configure<PathSettings>(options =>
{
    options.ImagePath = imageStoragePath;
});
builder.Services.AddHostedService<Worker>();

var host = builder.Build();
host.Run();
