using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using System;

namespace Discapp.Shared.Data
{
	public class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
	{
		public ApplicationDbContext CreateDbContext(string[] args)
		{
			var dbHost = Environment.GetEnvironmentVariable("LOCALIB_DB_HOST") ?? "localhost";
			var dbPort = Environment.GetEnvironmentVariable("LOCALIB_DB_PORT") ?? "5432";
			var dbName = Environment.GetEnvironmentVariable("LOCALIB_DB_NAME") ?? "postgres";
			var dbUser = Environment.GetEnvironmentVariable("LOCALIB_DB_USER") ?? "postgres";
			var dbPassword = Environment.GetEnvironmentVariable("LOCALIB_DB_PASSWORD") ?? "password";
			var connectionString = Environment.GetEnvironmentVariable("LOCALIB_CONNECTION_STRING")
				?? $"Host={dbHost};Port={dbPort};Database={dbName};Username={dbUser};Password={dbPassword};";

			var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
			optionsBuilder.UseNpgsql(connectionString);

			return new ApplicationDbContext(optionsBuilder.Options);
		}
	}
}
