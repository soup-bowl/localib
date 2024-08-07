using Microsoft.EntityFrameworkCore;

namespace DiscappAPI.Data
{
    public class ApplicationDbContext : DbContext
    {
        public DbSet<Queue> Queue { get; set; }
        public DbSet<Record> Records { get; set; }

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        // {
        //     optionsBuilder.UseMySql("Server=localhost;Database=discoarchive;User=root;Password=password;",
        //         new MySqlServerVersion(new Version(8, 0, 21)));
        // }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Record>(entity =>
            {
                entity.Property(e => e.Recorded).HasDefaultValue(DateTime.Now);
            });
        }
    }
}
