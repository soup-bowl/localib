
using Discapp.API.Models;
using Discapp.Shared.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Discapp.API.Services
{
	public interface IImageProcessService
	{
		Task<RecordReply> PostMyEntity(int[] input);
		Task<ActionResult<RecordReply>> PostMyEntityResponse(int[] input);
	}

	public class ImageProcessService(ApplicationDbContext context, PathSettings pathSettings) : IImageProcessService
	{
		private readonly ApplicationDbContext _context = context;
		private readonly PathSettings _pathSettings = pathSettings;

		public async Task<RecordReply> PostMyEntity(int[] input)
		{
			RecordReply records = new();

			List<Record> existingRecords = await _context.Records
				.Where(r => input.Contains(r.RecordID))
				.ToListAsync();

			HashSet<int> existingRecordIds = new(existingRecords.Select(r => r.RecordID));

			foreach (Record record in existingRecords)
			{
				records.Available.Add(new()
				{
					RecordID = record.RecordID,
					Image = GetImage(record.RecordID.ToString(), "thumb", "jpg") ?? "",
					ImageHigh = GetImage(record.RecordID.ToString(), "w3", "webp") ?? "",
					Barcode = record.Barcode
				});
			}

			// Shoutout to Missing Records in Glasgow.
			IEnumerable<int> missingRecordIds = input.Except(existingRecordIds);
			foreach (int recordId in missingRecordIds)
			{
				Queue myEntity = new() { RecordID = recordId };
				_context.Queue.Add(myEntity);
				records.Queued.Add(recordId);
			}

			await _context.SaveChangesAsync();

			return records;
		}

		public async Task<ActionResult<RecordReply>> PostMyEntityResponse(int[] input) =>
			await PostMyEntity(input);

		private string? GetImage(string recordID, string type, string format)
		{
			var mimeTypes = new Dictionary<string, string>
			{
				{ "jpg", "image/jpeg" },
				{ "webp", "image/webp" },
			};

			string fullPath = Path.Combine(_pathSettings.ImagePath, $"{recordID}_{type.ToLower()}.{format.ToLower()}");

			if (!File.Exists(fullPath))
			{
				return null;
			}

			byte[] fileBytes = File.ReadAllBytes(fullPath);
			string base64String = Convert.ToBase64String(fileBytes);
			string mimeType = mimeTypes[format.ToLower()];
			return $"data:{mimeType};base64,{base64String}";
		}
	}
}
