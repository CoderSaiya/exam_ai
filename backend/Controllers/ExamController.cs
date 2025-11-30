using ExamAI.API.Models;
using ExamAI.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace ExamAI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExamController : ControllerBase
{
    private readonly IN8nService _n8nService;

    public ExamController(IN8nService n8nService)
    {
        _n8nService = n8nService;
    }

    [HttpPost("generate")]
    public async Task<IActionResult> GenerateExam([FromBody] ExamRequest request)
    {
        if (string.IsNullOrEmpty(request.Topic))
        {
            return BadRequest("Topic is required.");
        }

        try
        {
            var questions = await _n8nService.GenerateQuestionsAsync(request);

            var exam = new Exam
            {
                Id = Guid.NewGuid(),
                Topic = request.Topic,
                CreatedAt = DateTime.UtcNow,
                Questions = questions
            };

            return Ok(exam);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }
}
