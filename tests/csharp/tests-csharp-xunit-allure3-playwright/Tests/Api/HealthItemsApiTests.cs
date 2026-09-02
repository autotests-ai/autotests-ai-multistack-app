using Allure.Net.Commons;
using Allure.Net.Commons.Attributes;
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
    [Trait("TestCategory", "api")]
    [Fact(DisplayName = "GET /api/health matches the health contract and reports ok")]
    public void HealthMatchesContract()
    {
        var response = RestSharpHttp.Request(Method.Get, "/api/health");
        Assert.True(Equals(200, response.Status), response.Body);
        JsonSchemas.AssertMatches(response.Body, "health.json");
        Assert.Equal("ok", response.Text("status"));
    }

    [Trait("TestCategory", "api")]
    [Fact(DisplayName = "GET /api/items matches the items contract (typed rows, named source)")]
    public void ItemsMatchContract()
    {
        var response = RestSharpHttp.Request(Method.Get, "/api/items");
        Assert.True(Equals(200, response.Status), response.Body);
        JsonSchemas.AssertMatches(response.Body, "items.json");
    }
}
