using Microsoft.EntityFrameworkCore;

namespace Discapp.Shared.Data
{
    public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
    {
        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            var connectionString = Environment.GetEnvironmentVariable("LOCALIB_CONNECTION_STRING");
            if (string.IsNullOrEmpty(connectionString))
            {
                throw new InvalidOperationException("Database connection string not set in environment variables.");
            }

            optionsBuilder.UseMySql(connectionString, new MySqlServerVersion(new Version(8, 0, 21)),
            b => b.MigrationsAssembly("Discapp.API"));
        }

        public DbSet<Queue> Queue { get; set; } = null!;
        public DbSet<Record> Records { get; set; } = null!;
    }
}
