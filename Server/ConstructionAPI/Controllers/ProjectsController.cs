using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.Threading.Tasks;

namespace ConstructionAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectsController : ControllerBase
    {
    //private readonly string _jsonPath = "../Server/projects.json";
private readonly string _jsonPath = Path.Combine(Directory.GetCurrentDirectory(), "projects.json");
        [HttpGet]
        public async Task<IActionResult> GetProjects()
        {
            if (!System.IO.File.Exists(_jsonPath))
                return NotFound("projects.json file not found.");

            var json = await System.IO.File.ReadAllTextAsync(_jsonPath);
            return Content(json, "application/json");
        }
    }
}
