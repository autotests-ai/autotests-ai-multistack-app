using System.Net;
using Dev.Multistack.App;
using Microsoft.AspNetCore.Builder;
using Xunit;

namespace BackendCSharpAspnet.Tests;

public sealed class ActuatorTests
{
    [Fact]
    public async Task HealthOnManagementPort()
    {
        await using var management = await StartManagementAsync();
        using var client = ManagementClient(management);

        var response = await client.GetAsync("/actuator/health");
        await Harness.RequireStatus(response, HttpStatusCode.OK);
        Assert.Contains("UP", await response.Content.ReadAsStringAsync(), StringComparison.Ordinal);
    }

    [Fact]
    public async Task PrometheusOnApiPortIsNotOk()
    {
        await using var h = await Harness.CreateAsync(new FakeStore());
        var response = await h.Do(HttpMethod.Get, "/actuator/prometheus");
        Assert.NotEqual(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task PrometheusScrapeAfterApiCall()
    {
        await using var h = await Harness.CreateAsync(new FakeStore());
        await using var management = await StartManagementAsync();
        using var client = ManagementClient(management);

        var api = await h.Do(HttpMethod.Get, "/api/health");
        await Harness.RequireStatus(api, HttpStatusCode.OK);

        var response = await client.GetAsync("/actuator/prometheus");
        await Harness.RequireStatus(response, HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("http_server_requests_seconds", body, StringComparison.Ordinal);
        Assert.Contains("method=\"GET\"", body, StringComparison.Ordinal);
        Assert.Contains("uri=\"/api/health\"", body, StringComparison.Ordinal);
        Assert.Contains("status=\"200\"", body, StringComparison.Ordinal);
    }

    private static async Task<WebApplication> StartManagementAsync()
    {
        var app = WebApp.CreateManagement("http://127.0.0.1:0");
        await app.StartAsync();
        return app;
    }

    private static HttpClient ManagementClient(WebApplication management) =>
        new() { BaseAddress = new Uri(management.Urls.Single().TrimEnd('/') + "/") };
}
