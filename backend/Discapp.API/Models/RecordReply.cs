using Discapp.Shared.Data;
using Microsoft.EntityFrameworkCore;

namespace Discapp.API.Models
{
    public class RecordReply
    {
        public List<AvailableRecord> Available { get; set; } = new List<AvailableRecord>();
        public List<int> Queued { get; set; } = new List<int>();
    }
}
