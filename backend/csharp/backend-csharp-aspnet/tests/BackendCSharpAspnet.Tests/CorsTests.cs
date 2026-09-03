using System.Net;
using Dev.Multistack.App.Api;
using Xunit;

namespace BackendCSharpAspnet.Tests;

public sealed class CorsTests
{
    [Fact]
    public async Task Preflight()
    {
        await using var h = await Harness.SeededAsync();
        var response = await h.Do(HttpMethod.Options, "/api/auth/login", headers: new Dictionary<string, string>
        {
            ["Origin"] = "https://autotests.ai",
            ["Access-Control-Request-Method"] = "POST",
            ["Access-Control-Request-Headers"] = "authorization,content-type",
        });
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal("*", response.Headers.GetValues("Access-Control-Allow-Origin").Single());
        Assert.Equal(CorsMiddleware.AllowedMethods, response.Headers.GetValues("Access-Control-Allow-Methods").Single());
        Assert.Equal("authorization,content-type", response.Headers.GetValues("Access-Control-Allow-Headers").Single());
        Assert.Equal(CorsMiddleware.ExposedHeaders, response.Headers.GetValues("Access-Control-Expose-Headers").Single());
        Assert.False(response.Headers.Contains("Access-Control-Allow-Credentials"));
    }

    [Fact]
    public async Task OnSimpleRequest()
    {
        await using var h = await Harness.SeededAsync();
        var response = await h.Do(HttpMethod.Get, "/api/health", headers: new Dictionary<string, string>
        {
            ["Origin"] = "https://autotests.ai",
        });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("*", response.Headers.GetValues("Access-Control-Allow-Origin").Single());
        Assert.Equal("*", response.Headers.GetValues("Access-Control-Allow-Headers").Single());
    }
}
