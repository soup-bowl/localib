using DiscappAPI.Data;
using Microsoft.EntityFrameworkCore;

namespace DiscappAPI.Models
{
    public class RecordReply
    {
        public List<Record> Available { get; set; } = new List<Record>();
		public List<int> Queued { get; set; } = new List<int>();
    }
}
