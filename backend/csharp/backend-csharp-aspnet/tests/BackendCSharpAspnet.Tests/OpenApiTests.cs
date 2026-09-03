using System.Net;
using System.Text;
using Xunit;

namespace BackendCSharpAspnet.Tests;

public sealed class OpenApiTests
{
    [Fact]
    public async Task SpecMatchesContractCopy()
    {
        var (copyPath, ssotPath) = OpenApiPaths();
        var expected = await File.ReadAllBytesAsync(copyPath);
        var ssot = await File.ReadAllBytesAsync(ssotPath);
        Assert.True(expected.SequenceEqual(ssot), "Resources/openapi.yaml differs from _contract/openapi.yaml");

        await using var h = await Harness.CreateAsync(new FakeStore());
        var response = await h.Do(HttpMethod.Get, "/api/openapi.yaml");
        await Harness.RequireStatus(response, HttpStatusCode.OK);
        var contentType = response.Content.Headers.ContentType?.ToString() ?? "";
        Assert.Contains("application/yaml", contentType, StringComparison.Ordinal);
        var body = await response.Content.ReadAsByteArrayAsync();
        Assert.True(expected.SequenceEqual(body), "GET /api/openapi.yaml body differs from the module copy");
    }

    [Fact]
    public async Task DocsServesSwaggerUi()
    {
        await using var h = await Harness.CreateAsync(new FakeStore());
        var response = await h.Do(HttpMethod.Get, "/api/docs");
        await Harness.RequireStatus(response, HttpStatusCode.OK);
        var contentType = response.Content.Headers.ContentType?.ToString() ?? "";
        Assert.Contains("text/html", contentType, StringComparison.Ordinal);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("SwaggerUIBundle", body, StringComparison.Ordinal);
        Assert.Contains("./openapi.yaml", body, StringComparison.Ordinal);
    }

    private static (string CopyPath, string SsotPath) OpenApiPaths()
    {
        var moduleRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".."));
        return (
            Path.Combine(moduleRoot, "src", "BackendCSharpAspnet", "Resources", "openapi.yaml"),
            Path.GetFullPath(Path.Combine(moduleRoot, "..", "..", "..", "_contract", "openapi.yaml")));
    }
}
