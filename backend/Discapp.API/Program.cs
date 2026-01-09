using Microsoft.EntityFrameworkCore;
using Discapp.Shared.Data;
using Discapp.API.Models;
using Discapp.API.Services;
using Discapp.API.Models.Auth;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

var dbHost = Environment.GetEnvironmentVariable("LOCALIB_DB_HOST") ?? "localhost";
var dbPort = Environment.GetEnvironmentVariable("LOCALIB_DB_PORT") ?? "5432";
var dbName = Environment.GetEnvironmentVariable("LOCALIB_DB_NAME") ?? "postgres";
var dbUser = Environment.GetEnvironmentVariable("LOCALIB_DB_USER") ?? "postgres";
var dbPassword = Environment.GetEnvironmentVariable("LOCALIB_DB_PASSWORD") ?? "password";
var connectionString = Environment.GetEnvironmentVariable("LOCALIB_CONNECTION_STRING")
    ?? $"Host={dbHost};Port={dbPort};Database={dbName};Username={dbUser};Password={dbPassword};";

var imageStoragePath = Environment.GetEnvironmentVariable("LOCALIB_IMAGE_PATH") ?? "./Images";
var ClientKey = Environment.GetEnvironmentVariable("LOCALIB_DISCOGS_CONSUMER_KEY");
var ClientSecret = Environment.GetEnvironmentVariable("LOCALIB_DISCOGS_CONSUMER_SECRET");
var CallbackURL = Environment.GetEnvironmentVariable("LOCALIB_DISCOGS_CALLBACK_URL");

// --- CORS ---
string? allowedOrigins = Environment.GetEnvironmentVariable("LOCALIB_CORS_ALLOWED_ORIGINS");
if (string.IsNullOrEmpty(allowedOrigins))
{
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("DefaultPolicy", builder =>
        {
            builder.AllowAnyOrigin()
                   .AllowAnyMethod()
                   .AllowAnyHeader();
        });
    });
}
else
{
    string[] origins = allowedOrigins.Split(",", StringSplitOptions.RemoveEmptyEntries);
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("DefaultPolicy", builder =>
        {
            builder.WithOrigins(origins)
                   .WithMethods("POST")
                   .AllowAnyHeader();
        });
    });
}

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString, b => b.MigrationsAssembly("Discapp.API")));

builder.Services.AddSingleton(new PathSettings { ImagePath = imageStoragePath ?? "." });
builder.Services.AddSingleton(new AuthSettings
{
    ConsumerKey = ClientKey ?? "",
    ConsumerSecret = ClientSecret ?? "",
    CallbackURL = CallbackURL ?? ""
});

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IImageProcessService, ImageProcessService>();

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi("v1", options =>
{
    options.AddDocumentTransformer((document, context, cancellationToken) =>
    {
        document.Info = new OpenApiInfo
        {
            Title = "Localib Vinyl",
            Version = "v1"
        };

        document.Components ??= new OpenApiComponents();
        document.Components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>();

        // Equivalent of your Swashbuckle AddSecurityDefinition("Bearer", ...)
        document.Components.SecuritySchemes["Bearer"] = new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            In = ParameterLocation.Header,
            Name = "Authorization",
            Description = "Used for the Discogs class of APIs. Enter your token like this: 'Bearer ACCESS_TOKEN&SECRET_TOKEN'"
        };

        // Apply it globally (similar to adding a security requirement everywhere)
        foreach (var operation in document.Paths.Values.SelectMany(p => p.Operations))
        {
            operation.Value.Security ??= [];
            operation.Value.Security.Add(new OpenApiSecurityRequirement
            {
                [new OpenApiSecuritySchemeReference("Bearer", document)] = []
            });
        }

        return Task.CompletedTask;
    });
});
builder.Services.AddHttpClient();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("DefaultPolicy");

app.UseHttpsRedirection();

app.MapControllers();

await app.RunAsync();
