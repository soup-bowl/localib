using Microsoft.EntityFrameworkCore;

namespace Discapp.Shared.Data
{
    public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
    {
        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            var dbHost = Environment.GetEnvironmentVariable("LOCALIB_DB_HOST") ?? "localhost";
            var dbPort = Environment.GetEnvironmentVariable("LOCALIB_DB_PORT") ?? "3306";
            var dbName = Environment.GetEnvironmentVariable("LOCALIB_DB_NAME") ?? "database";
            var dbUser = Environment.GetEnvironmentVariable("LOCALIB_DB_USER") ?? "root";
            var dbPassword = Environment.GetEnvironmentVariable("LOCALIB_DB_PASSWORD") ?? "password";
            var connectionString = Environment.GetEnvironmentVariable("LOCALIB_CONNECTION_STRING")
                ?? $"Server={dbHost};Port={dbPort};Database={dbName};User={dbUser};Password={dbPassword};";

            optionsBuilder.UseMySql(connectionString, new MySqlServerVersion(new Version(8, 0, 21)),
            b => b.MigrationsAssembly("Discapp.API"));
        }

        public DbSet<Queue> Queue { get; set; } = null!;
        public DbSet<Record> Records { get; set; } = null!;
    }
}
