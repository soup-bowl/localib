using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Discapp.Shared.Data
{
    public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
    {
        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            var dbHost = Environment.GetEnvironmentVariable("LOCALIB_DB_HOST") ?? "localhost";
            var dbPort = Environment.GetEnvironmentVariable("LOCALIB_DB_PORT") ?? "5432";
            var dbName = Environment.GetEnvironmentVariable("LOCALIB_DB_NAME") ?? "postgres";
            var dbUser = Environment.GetEnvironmentVariable("LOCALIB_DB_USER") ?? "postgres";
            var dbPassword = Environment.GetEnvironmentVariable("LOCALIB_DB_PASSWORD") ?? "password";
            var connectionString = Environment.GetEnvironmentVariable("LOCALIB_CONNECTION_STRING")
                ?? $"Host={dbHost};Port={dbPort};Database={dbName};Username={dbUser};Password={dbPassword};";

            optionsBuilder.UseNpgsql(connectionString, b => b.MigrationsAssembly("Discapp.API"));
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // PQL cries over a DT that isn't UTC - rightly so.
            var dateTimeConverter = new ValueConverter<DateTime, DateTime>(
                v => v.Kind == DateTimeKind.Utc ? v : v.ToUniversalTime(),
                v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

            modelBuilder.Entity<Record>()
                .Property(r => r.Recorded)
                .HasConversion(dateTimeConverter);

            base.OnModelCreating(modelBuilder);
        }

        public DbSet<Queue> Queue { get; set; } = null!;
        public DbSet<Record> Records { get; set; } = null!;
    }
}
