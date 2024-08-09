using Microsoft.EntityFrameworkCore;

namespace Discapp.Shared.Data
{
    public class Record
    {
        public int Id { get; set; }
        public int RecordID { get; set; }
		public string FilePath { get; set; } = "";
		public DateTime Recorded { get; set; }
    }
}
