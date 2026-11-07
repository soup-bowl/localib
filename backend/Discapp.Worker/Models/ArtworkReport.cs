namespace Discapp.Worker.Models;

/// <summary>
/// A step-by-step account of processing one release's artwork, used for logging and the debug endpoint.
/// </summary>
public class ArtworkReport
{
	public int RecordId { get; set; }
	public bool Success { get; set; }
	public string? Error { get; set; }
	public List<string> Steps { get; set; } = [];
	public string ThumbUrl { get; set; } = "";
	public List<DiscogsImages> Images { get; set; } = [];
	public string CoverUrl { get; set; } = "";
	public string? ThumbPath { get; set; }
	public long? ThumbBytes { get; set; }
	public string? CoverContentType { get; set; }
	public long? CoverDownloadBytes { get; set; }
	public string? CoverPath { get; set; }
	public long? CoverBytes { get; set; }

	internal void Step(string message) => Steps.Add(message);
}
