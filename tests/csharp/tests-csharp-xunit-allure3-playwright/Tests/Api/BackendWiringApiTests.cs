using Allure.Net.Commons;
using Allure.Net.Commons.Attributes;
using Api;
using RestSharp;
using Tests;

namespace Tests.Api;

/// <summary>
/// Deployed-stand facts about the active backend module and its PostgreSQL wiring.
/// Response shapes/types are the api layer's job (<c>HealthItemsApiTests</c>).
/// </summary>
[AllureEpic("Wired backend")]
[AllureFeature("Health and data source")]
[AllureSeverity(SeverityLevel.blocker)]
[AllureSuite("Backend wiring on deployed stand")]
public sealed class BackendWiringApiTests : ApiTestBase
{
    [Trait("TestCategory", "api")]
    [Trait("TestCategory", "smoke")]
    [Fact(DisplayName = "GET /api/health — deployed service is the active backend module, not a neighbour")]
    public void HealthReportsActiveBackendService()
    {
        var response = RestSharpHttp.Request(Method.Get, "/api/health");
        Assert.True(Equals(200, response.Status), response.Body);
        Assert.Equal(Config.ApiHealthService, response.Text("service"));
    }

    [Trait("TestCategory", "api")]
    [Fact(DisplayName = "GET /api/items — catalogue is served from PostgreSQL, not a stub or fallback")]
    public void ItemsAreWiredToPostgreSQL()
    {
        var response = RestSharpHttp.Request(Method.Get, "/api/items");
        Assert.True(Equals(200, response.Status), response.Body);
        Assert.Equal("postgresql", response.Text("source"));
    }
}
