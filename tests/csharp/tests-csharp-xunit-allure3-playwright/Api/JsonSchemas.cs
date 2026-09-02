using NJsonSchema;

namespace Api;

public static class JsonSchemas
{
    public static void AssertMatches(string body, string name)
    {
        var path = Path.Combine(AppContext.BaseDirectory, "schemas", name);
        Assert.True(File.Exists(path), $"missing schema {name}");
        var schema = JsonSchema.FromJsonAsync(File.ReadAllText(path)).GetAwaiter().GetResult();
        var errors = schema.Validate(body);
        Assert.True(
            errors.Count == 0,
            $"{name}: {string.Join("; ", errors.Select(e => e.ToString()))} — {body}");
    }
}
