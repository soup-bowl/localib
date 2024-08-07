using DiscappAPI.Data;
using DiscappAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiscappAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class QueueController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public QueueController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Queue>>> GetMyEntities()
        {
            return await _context.Queue.ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<RecordReply>> PostMyEntity(int[] input)
        {
            RecordReply records = new RecordReply();

            foreach (var recordId in input)
            {
                var record = await _context.Records.FirstOrDefaultAsync(r => r.RecordID == recordId);

                if (record != null)
                {
                    records.Available.Add(record);
                }
                else
                {
                    var myEntity = new Queue { RecordID = recordId };
                    _context.Queue.Add(myEntity);
                    records.Queued.Add(recordId);
                }
            }

            await _context.SaveChangesAsync();

            return Ok(records);
        }

    }
}
