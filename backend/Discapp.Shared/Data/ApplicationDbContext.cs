using Microsoft.EntityFrameworkCore;

namespace Discapp.Shared.Data
{
    public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
    {
        public DbSet<Queue> Queue { get; set; } = null!;
        public DbSet<Record> Records { get; set; } = null!;
	}
}
