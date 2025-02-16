using Microsoft.EntityFrameworkCore;
using Discapp.Shared.Data;
using Discapp.API.Models;
using Discapp.API.Services;
using Microsoft.OpenApi.Models;
using Discapp.API.Models.Auth;

var builder = WebApplication.CreateBuilder(args);

var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
                       ?? builder.Configuration.GetConnectionString("DefaultConnection");

var imageStoragePath = Environment.GetEnvironmentVariable("PathSettings__ImagePath")
                       ?? builder.Configuration["PathSettings:ImagePath"];

var ClientKey = Environment.GetEnvironmentVariable("Discogs__ConsumerKey")
                       ?? builder.Configuration["Discogs:ConsumerKey"];
var ClientSecret = Environment.GetEnvironmentVariable("Discogs__ConsumerSecret")
                       ?? builder.Configuration["Discogs:ConsumerSecret"];
var CallbackURL = Environment.GetEnvironmentVariable("Discogs__CallbackURL")
                       ?? builder.Configuration["Discogs:CallbackURL"];

// --- CORS ---
string? allowedOrigins = Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGINS");
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
    options.UseMySql(connectionString, new MySqlServerVersion(new Version(8, 0, 21)),
    b => b.MigrationsAssembly("Discapp.API")));

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

app.Run();
