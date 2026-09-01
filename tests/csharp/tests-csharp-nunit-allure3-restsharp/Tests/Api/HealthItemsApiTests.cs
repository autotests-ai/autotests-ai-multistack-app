using Allure.Net.Commons;
using Allure.NUnit.Attributes;
using Api;
using RestSharp;
using Tests;

namespace Tests.Api;

/// <summary>
/// HTTP contract of <c>/api/health</c> and <c>/api/items</c>: shapes and types, not deployment facts.
/// Which service answers and where the data physically lives is asserted by
/// <c>BackendWiringApiTests</c> and <c>SeedDataApiTests</c>.
/// </summary>
[AllureEpic("Home")]
[AllureFeature("Health and items")]
[AllureSeverity(SeverityLevel.normal)]
[AllureSuite("Health and items API")]
public sealed class HealthItemsApiTests : ApiTestBase
{
    [Test]
    [Category("api")]
    [AllureName("GET /api/health matches the health contract and reports ok")]
    public void HealthMatchesContract()
    {
        var response = RestSharpHttp.Request(Method.Get, "/api/health");
        Assert.That(response.Status, Is.EqualTo(200), response.Body);
        JsonSchemas.AssertMatches(response.Body, "health.json");
        Assert.That(response.Text("status"), Is.EqualTo("ok"));
    }

    [Test]
    [Category("api")]
    [AllureName("GET /api/items matches the items contract (typed rows, named source)")]
    public void ItemsMatchContract()
    {
        var response = RestSharpHttp.Request(Method.Get, "/api/items");
        Assert.That(response.Status, Is.EqualTo(200), response.Body);
        JsonSchemas.AssertMatches(response.Body, "items.json");
    }
}
