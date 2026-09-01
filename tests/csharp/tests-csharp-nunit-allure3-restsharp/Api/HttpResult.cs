using System.Text.Json;

namespace Api;

public sealed record HttpResult(int Status, string Body)
{
    private JsonElement Json
    {
        get
        {
            using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(Body) ? "{}" : Body);
            return doc.RootElement.Clone();
        }
    }

    public string Text(string field) =>
        Json.TryGetProperty(field, out var value) ? value.GetString() ?? "" : "";

    public IReadOnlyList<string> ItemNames()
    {
        if (!Json.TryGetProperty("items", out var items) || items.ValueKind != JsonValueKind.Array)
        {
            return [];
        }

        return items.EnumerateArray()
            .Select(item => item.TryGetProperty("name", out var name) ? name.GetString() ?? "" : "")
            .ToList();
    }
}
