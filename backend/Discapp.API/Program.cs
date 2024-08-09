using Microsoft.EntityFrameworkCore;
using Discapp.Shared.Data;
using Discapp.API.Models;

var builder = WebApplication.CreateBuilder(args);

var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
                       ?? builder.Configuration.GetConnectionString("DefaultConnection");

var imageStoragePath = Environment.GetEnvironmentVariable("PathSettings__ImagePath")
                       ?? builder.Configuration["PathSettings:ImagePath"];

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
                   .AllowAnyMethod()
                   .AllowAnyHeader();
        });
    });
}

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(connectionString, new MySqlServerVersion(new Version(8, 0, 21)),
    b => b.MigrationsAssembly("Discapp.API")));

builder.Services.AddSingleton(new PathSettings { ImagePath = imageStoragePath ?? "." });

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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
