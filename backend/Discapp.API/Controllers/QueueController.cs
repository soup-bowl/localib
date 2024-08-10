using Discapp.Shared.Data;
using Discapp.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Discapp.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class QueueController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly PathSettings _pathSettings;

        public QueueController(ApplicationDbContext context, PathSettings pathSettings)
        {
            _context = context;
            _pathSettings = pathSettings;
        }

        [HttpPost]
        public async Task<ActionResult<RecordReply>> PostMyEntity(int[] input)
        {
            RecordReply records = new();

            foreach (int recordId in input)
            {
                Record? record = await _context.Records.FirstOrDefaultAsync(r => r.RecordID == recordId);

                if (record != null)
                {
                    string fullPath = Path.Combine(_pathSettings.ImagePath, record.FilePath);
                    byte[] fileBytes = System.IO.File.ReadAllBytes(fullPath);
                    string base64String = Convert.ToBase64String(fileBytes);

                    records.Available.Add(new()
                    {
                        RecordID = record.RecordID,
                        Image = $"data:image/jpeg;base64,{base64String}"
                    });
                }
                else
                {
                    Queue myEntity = new() { RecordID = recordId };
                    _context.Queue.Add(myEntity);
                    records.Queued.Add(recordId);
                }
            }

            await _context.SaveChangesAsync();

            return Ok(records);
        }
    }
}
