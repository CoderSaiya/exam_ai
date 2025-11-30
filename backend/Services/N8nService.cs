using System.Text;
using System.Text.Json;
using ExamAI.API.Models;

namespace ExamAI.API.Services;

public interface IN8nService
{
    Task<List<Question>> GenerateQuestionsAsync(ExamRequest request);
}

public class N8nService(HttpClient httpClient, IConfiguration configuration) : IN8nService
{
    public async Task<List<Question>> GenerateQuestionsAsync(ExamRequest request)
    {
        var webhookUrl = configuration["N8n:WebhookUrl"];
        if (string.IsNullOrEmpty(webhookUrl))
        {
            throw new InvalidOperationException("N8n Webhook URL is not configured.");
        }

        // Gửi request sang n8n
        var jsonContent = new StringContent(
            JsonSerializer.Serialize(request),
            Encoding.UTF8,
            "application/json");

        var response = await httpClient.PostAsync(webhookUrl, jsonContent);
        var raw = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new Exception($"n8n returned {response.StatusCode}: {raw}");
        }

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        try
        {
            using var doc = JsonDocument.Parse(raw);
            var root = doc.RootElement;

            // Trường hợp 1: { "questions": [ ... ] }  <-- đúng với JSON bạn gửi
            if (root.ValueKind == JsonValueKind.Object &&
                root.TryGetProperty("questions", out var questionsElement))
            {
                var questionsJson = questionsElement.GetRawText();
                return JsonSerializer.Deserialize<List<Question>>(questionsJson, options)
                       ?? new List<Question>();
            }

            // Trường hợp 2: [ { ... }, { ... } ]
            if (root.ValueKind == JsonValueKind.Array)
            {
                return JsonSerializer.Deserialize<List<Question>>(raw, options)
                       ?? new List<Question>();
            }

            throw new Exception("Unexpected JSON shape from n8n.");
        }
        catch (JsonException ex)
        {
            throw new Exception($"Failed to parse n8n response JSON: {ex.Message}. Raw: {raw}");
        }
    }
}