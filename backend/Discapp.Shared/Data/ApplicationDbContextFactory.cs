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
			var dbPort = Environment.GetEnvironmentVariable("LOCALIB_DB_PORT") ?? "3306";
			var dbName = Environment.GetEnvironmentVariable("LOCALIB_DB_NAME") ?? "database";
			var dbUser = Environment.GetEnvironmentVariable("LOCALIB_DB_USER") ?? "root";
			var dbPassword = Environment.GetEnvironmentVariable("LOCALIB_DB_PASSWORD") ?? "password";
			var connectionString = Environment.GetEnvironmentVariable("LOCALIB_CONNECTION_STRING")
				?? $"Server={dbHost};Port={dbPort};Database={dbName};User={dbUser};Password={dbPassword};";

			var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
			optionsBuilder.UseMySql(connectionString, new MySqlServerVersion(new Version(8, 0, 21)));

			return new ApplicationDbContext(optionsBuilder.Options);
		}
	}
}
