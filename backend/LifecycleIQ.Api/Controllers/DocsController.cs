using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LifecycleIQ.Api.Controllers;

[ApiController]
[Route("api/docs")]
[Authorize]
public class DocsController(IWebHostEnvironment env) : ControllerBase
{
    [HttpGet("project-spec")]
    [AllowAnonymous]
    public IActionResult DownloadProjectSpec()
    {
        var path = Path.Combine(env.WebRootPath, "docs", "LifecycleIQ-ProjectSpec.docx");
        if (!System.IO.File.Exists(path))
            return NotFound(new { message = "Project specification document not found." });

        var stream = System.IO.File.OpenRead(path);
        return File(
            stream,
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "LifecycleIQ-ProjectSpec.docx"
        );
    }

    [HttpGet]
    public IActionResult ListDocs()
    {
        return Ok(new[]
        {
            new
            {
                name        = "LifecycleIQ Project Specification",
                filename    = "LifecycleIQ-ProjectSpec.docx",
                description = "Full project proposal and system specification document including WFA algorithm design, AI module, and architecture.",
                downloadUrl = "/api/docs/project-spec",
                type        = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            }
        });
    }
}
