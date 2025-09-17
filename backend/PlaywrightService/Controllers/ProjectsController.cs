using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlaywrightService.Data;
using PlaywrightService.Models.Entities;

namespace PlaywrightService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProjectsController : ControllerBase
{
    private readonly PlaywrightDbContext _context;

    public ProjectsController(PlaywrightDbContext context)
    {
        _context = context;
    }

    // GET: api/projects
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Project>>> GetProjects()
    {
        return await _context.Projects
            .Include(p => p.User)
            .Where(p => p.IsActive)
            .ToListAsync();
    }

    // GET: api/projects/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<Project>> GetProject(Guid id)
    {
        var project = await _context.Projects
            .Include(p => p.User)
            .Include(p => p.Websites)
            .FirstOrDefaultAsync(p => p.Id == id && p.IsActive);

        if (project == null)
        {
            return NotFound();
        }

        return project;
    }

    // POST: api/projects
    [HttpPost]
    public async Task<ActionResult<Project>> CreateProject(Project project)
    {
        project.Id = Guid.NewGuid();
        project.CreatedAt = DateTime.UtcNow;
        project.UpdatedAt = DateTime.UtcNow;
        project.IsActive = true;

        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetProject), new { id = project.Id }, project);
    }

    // PUT: api/projects/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProject(Guid id, Project project)
    {
        if (id != project.Id)
        {
            return BadRequest();
        }

        var existingProject = await _context.Projects.FindAsync(id);
        if (existingProject == null || !existingProject.IsActive)
        {
            return NotFound();
        }

        existingProject.Name = project.Name;
        existingProject.Description = project.Description;
        existingProject.UpdatedAt = DateTime.UtcNow;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!ProjectExists(id))
            {
                return NotFound();
            }
            throw;
        }

        return NoContent();
    }

    // DELETE: api/projects/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProject(Guid id)
    {
        var project = await _context.Projects.FindAsync(id);
        if (project == null || !project.IsActive)
        {
            return NotFound();
        }

        // Soft delete
        project.IsActive = false;
        project.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool ProjectExists(Guid id)
    {
        return _context.Projects.Any(e => e.Id == id && e.IsActive);
    }
}
