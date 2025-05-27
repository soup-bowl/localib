using Microsoft.EntityFrameworkCore;
using Discapp.Shared.Data;
using Discapp.API.Models;
using Discapp.API.Services;
using Microsoft.OpenApi.Models;
using Discapp.API.Models.Auth;

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
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Localib Vinyl", Version = "v1" });

    OpenApiSecurityScheme securityScheme = new()
    {
        Name = "Authorization",
        Description = "Used for the Discogs class of APIs. Enter your token like this: 'Bearer ACCESS_TOKEN&SECRET_TOKEN'",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer"
    };

    c.AddSecurityDefinition("Bearer", securityScheme);
});
builder.Services.AddHttpClient();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("DefaultPolicy");

app.UseHttpsRedirection();

app.MapControllers();

await app.RunAsync();
