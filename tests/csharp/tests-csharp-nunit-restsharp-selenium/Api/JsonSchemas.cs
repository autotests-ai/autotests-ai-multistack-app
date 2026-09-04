using NJsonSchema;

namespace Api;

public static class JsonSchemas
{
    public static void AssertMatches(string body, string name)
    {
        var path = Path.Combine(AppContext.BaseDirectory, "schemas", name);
        Assert.That(File.Exists(path), Is.True, $"missing schema {name}");
        var schema = JsonSchema.FromJsonAsync(File.ReadAllText(path)).GetAwaiter().GetResult();
        var errors = schema.Validate(body);
        Assert.That(errors, Is.Empty, $"{name}: {string.Join("; ", errors.Select(e => e.ToString()))} — {body}");
    }
}
