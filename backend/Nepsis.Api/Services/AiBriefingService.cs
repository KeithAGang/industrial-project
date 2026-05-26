using System.Text;
using System.Text.Json;
using Nepsis.Api.Models;

namespace Nepsis.Api.Services;

public class AiBriefingService(IHttpClientFactory httpClientFactory, IConfiguration config, ILogger<AiBriefingService> logger)
{
    // Gemini API — free tier via Google AI Studio
    private const string Model = "gemini-2.0-flash";

    public async Task<string?> GenerateBriefingAsync(ShiRecord record, string solutionName)
    {
        if (!config.GetValue<bool>("Gemini:Enabled", true) || string.IsNullOrEmpty(config["Gemini:ApiKey"]))
            return null;

        try
        {
            var prompt = $"Generate a 3-sentence maintenance briefing for solution '{solutionName}'. " +
                         $"SHI score: {record.ShiScore:F2} ({record.RiskTier} risk). " +
                         $"Factors: Licence Urgency={record.LicenceUrgencyScore:F2} (weight {record.LicenceUrgencyWeight}), " +
                         $"Version Gap={record.VersionGapScore:F2} (weight {record.VersionGapWeight}), " +
                         $"SLA Compliance={record.SlaComplianceScore:F2} (weight {record.SlaComplianceWeight}), " +
                         $"Maintenance Recency={record.MaintenanceRecencyScore:F2} (weight {record.MaintenanceRecencyWeight}). " +
                         "Sentence 1: state the overall risk level plainly. " +
                         "Sentence 2: identify the dominant risk factor and its implication. " +
                         "Sentence 3: state the recommended action. Keep it concise and professional.";

            var body = JsonSerializer.Serialize(new
            {
                contents = new[]
                {
                    new { parts = new[] { new { text = prompt } } }
                },
                generationConfig = new { maxOutputTokens = 200 }
            });

            var apiKey = config["Gemini:ApiKey"];
            var url    = $"https://generativelanguage.googleapis.com/v1beta/models/{Model}:generateContent?key={apiKey}";

            var client   = httpClientFactory.CreateClient();
            var response = await client.PostAsync(url, new StringContent(body, Encoding.UTF8, "application/json"));

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Gemini API returned {Status} for solution {Name}", response.StatusCode, solutionName);
                return null;
            }

            using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
            return doc.RootElement
                       .GetProperty("candidates")[0]
                       .GetProperty("content")
                       .GetProperty("parts")[0]
                       .GetProperty("text")
                       .GetString();
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "AI briefing generation failed for solution {Name}", solutionName);
            return null;
        }
    }
}
