using Discapp.API.Models;
using Discapp.Shared.Data;
using Discapp.Worker;
using Discapp.Worker.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Discapp.API.Controllers
{
	/// <summary>
	/// Diagnostics for artwork processing. Only available when LOCALIB_ENABLE_DEBUG_ENDPOINTS is "true".
	/// </summary>
	[ApiController]
	[Route("api/[controller]")]
	public class DebugController(ApplicationDbContext context, ArtworkProcessor processor, Models.PathSettings pathSettings, DebugSettings debugSettings) : ControllerBase
	{
		private readonly ApplicationDbContext _context = context;
		private readonly ArtworkProcessor _processor = processor;
		private readonly Models.PathSettings _pathSettings = pathSettings;
		private readonly DebugSettings _debugSettings = debugSettings;

		/// <summary>
		/// Reports what is currently stored for a release, without contacting Discogs.
		/// </summary>
		[HttpGet("Artwork/{id:int}")]
		public async Task<ActionResult<ArtworkStatus>> GetArtworkStatus(int id)
		{
			if (!_debugSettings.Enabled)
				return NotFound();

			return Ok(await BuildStatusAsync(id));
		}

		/// <summary>
		/// Processes a release immediately, exactly as the Worker would, and reports every step.
		/// </summary>
		[HttpPost("Artwork/{id:int}")]
		public async Task<ActionResult<ArtworkDebugResult>> ProcessArtwork(int id, CancellationToken cancellationToken)
		{
			if (!_debugSettings.Enabled)
				return NotFound();

			ArtworkStatus before = await BuildStatusAsync(id);
			ArtworkReport report = await _processor.ProcessAsync(_context, id, cancellationToken);
			ArtworkStatus after = await BuildStatusAsync(id);

			return Ok(new ArtworkDebugResult { Before = before, Report = report, After = after });
		}

		/// <summary>
		/// Serves a stored image directly, so it can be opened in a browser. Type is "thumb" or "w3".
		/// </summary>
		[HttpGet("Artwork/{id:int}/{type}")]
		public IActionResult GetArtworkImage(int id, string type)
		{
			if (!_debugSettings.Enabled)
				return NotFound();

			(string extension, string mimeType) = type.ToLowerInvariant() switch
			{
				"thumb" => ("jpg", "image/jpeg"),
				"w3" => ("webp", "image/webp"),
				_ => ("", ""),
			};

			if (extension == "")
				return BadRequest("Type must be \"thumb\" or \"w3\".");

			string path = Path.Combine(_pathSettings.ImagePath, $"{id}_{type.ToLowerInvariant()}.{extension}");
			if (!System.IO.File.Exists(path))
				return NotFound();

			return PhysicalFile(Path.GetFullPath(path), mimeType);
		}

		private async Task<ArtworkStatus> BuildStatusAsync(int id)
		{
			Record? record = await _context.Records.AsNoTracking().FirstOrDefaultAsync(r => r.RecordID == id);

			return new ArtworkStatus
			{
				RecordId = id,
				ImagePath = Path.GetFullPath(_pathSettings.ImagePath),
				Recorded = record?.Recorded,
				Queued = await _context.Queue.AnyAsync(q => q.RecordID == id),
				Thumb = DescribeFile(id, "thumb", "jpg"),
				HighQuality = DescribeFile(id, "w3", "webp"),
			};
		}

		private ArtworkFileStatus DescribeFile(int id, string type, string extension)
		{
			FileInfo file = new(Path.Combine(_pathSettings.ImagePath, $"{id}_{type}.{extension}"));

			return new ArtworkFileStatus
			{
				Path = file.FullName,
				Exists = file.Exists,
				Bytes = file.Exists ? file.Length : null,
				Modified = file.Exists ? file.LastWriteTimeUtc : null,
			};
		}
	}

	public class ArtworkStatus
	{
		public int RecordId { get; set; }
		public string ImagePath { get; set; } = "";
		public DateTime? Recorded { get; set; }
		public bool Queued { get; set; }
		public ArtworkFileStatus Thumb { get; set; } = new();
		public ArtworkFileStatus HighQuality { get; set; } = new();
	}

	public class ArtworkFileStatus
	{
		public string Path { get; set; } = "";
		public bool Exists { get; set; }
		public long? Bytes { get; set; }
		public DateTime? Modified { get; set; }
	}

	public class ArtworkDebugResult
	{
		public ArtworkStatus Before { get; set; } = new();
		public ArtworkReport Report { get; set; } = new();
		public ArtworkStatus After { get; set; } = new();
	}
}
