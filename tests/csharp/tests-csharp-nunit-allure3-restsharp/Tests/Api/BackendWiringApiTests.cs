using Allure.Net.Commons;
using Allure.NUnit.Attributes;
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
    [Test]
    [Category("api")]
    [Category("smoke")]
    [AllureName("GET /api/health — deployed service is the active backend module, not a neighbour")]
    public void HealthReportsActiveBackendService()
    {
        var response = RestSharpHttp.Request(Method.Get, "/api/health");
        Assert.That(response.Status, Is.EqualTo(200), response.Body);
        Assert.That(response.Text("service"), Is.EqualTo(Config.ApiHealthService));
    }

    [Test]
    [Category("api")]
    [AllureName("GET /api/items — catalogue is served from PostgreSQL, not a stub or fallback")]
    public void ItemsAreWiredToPostgreSQL()
    {
        var response = RestSharpHttp.Request(Method.Get, "/api/items");
        Assert.That(response.Status, Is.EqualTo(200), response.Body);
        Assert.That(response.Text("source"), Is.EqualTo("postgresql"));
    }
}
