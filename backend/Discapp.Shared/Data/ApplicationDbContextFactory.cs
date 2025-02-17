using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using System;

namespace Discapp.Shared.Data
{
	public class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
	{
		public ApplicationDbContext CreateDbContext(string[] args)
		{
			var connectionString = Environment.GetEnvironmentVariable("LOCALIB_CONNECTION_STRING")
				?? throw new InvalidOperationException("Database connection string is missing.");

			var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
			optionsBuilder.UseMySql(connectionString, new MySqlServerVersion(new Version(8, 0, 21)));

			return new ApplicationDbContext(optionsBuilder.Options);
		}
	}
}
