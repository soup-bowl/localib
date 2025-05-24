using Discapp.Worker;
using Discapp.Worker.Models;
using Discapp.Shared.Data;
using Microsoft.EntityFrameworkCore;
using Discapp.Shared.Models;

var builder = Host.CreateApplicationBuilder(args);

var dbHost = Environment.GetEnvironmentVariable("LOCALIB_DB_HOST") ?? "localhost";
var dbPort = Environment.GetEnvironmentVariable("LOCALIB_DB_PORT") ?? "5432";
var dbName = Environment.GetEnvironmentVariable("LOCALIB_DB_NAME") ?? "postgres";
var dbUser = Environment.GetEnvironmentVariable("LOCALIB_DB_USER") ?? "postgres";
var dbPassword = Environment.GetEnvironmentVariable("LOCALIB_DB_PASSWORD") ?? "password";
var connectionString = Environment.GetEnvironmentVariable("LOCALIB_CONNECTION_STRING")
    ?? $"Host={dbHost};Port={dbPort};Database={dbName};Username={dbUser};Password={dbPassword};";

var imageStoragePath = Environment.GetEnvironmentVariable("LOCALIB_IMAGE_PATH") ?? "./Images";
var ClientKey = Environment.GetEnvironmentVariable("LOCALIB_DISCOGS_CONSUMER_KEY") ?? "";
var ClientSecret = Environment.GetEnvironmentVariable("LOCALIB_DISCOGS_CONSUMER_SECRET") ?? "";

builder.Services.Configure<DiscogApiSettings>(builder.Configuration.GetSection("DiscogApis"));

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString)
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
await host.RunAsync();
