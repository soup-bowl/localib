using Discapp.API.Models;
using Microsoft.AspNetCore.Mvc;
using Discapp.API.Services;

namespace Discapp.API.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class QueueController(IImageProcessService imageProcessService) : ControllerBase
	{
		private readonly IImageProcessService _imageProcessService = imageProcessService;

		[HttpPost]
		public Task<ActionResult<RecordReply>> PostMyEntity(int[] input) =>
			_imageProcessService.PostMyEntityResponse(input);
	}
}
