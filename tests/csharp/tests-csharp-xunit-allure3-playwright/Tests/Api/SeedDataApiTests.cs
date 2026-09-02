using Allure.Net.Commons;
using Allure.Net.Commons.Attributes;
using Api;
using RestSharp;
using Tests;

namespace Tests.Api;

[AllureEpic("Deploy readiness")]
[AllureFeature("Seed data")]
[AllureSeverity(SeverityLevel.critical)]
[AllureSuite("Seed data on deployed stand")]
public sealed class SeedDataApiTests : ApiTestBase
{
    [Trait("TestCategory", "api")]
    [Trait("TestCategory", "smoke")]
    [Fact(DisplayName = "Flyway seed items Alpha, Beta, Gamma are present in PostgreSQL")]
    public void SeededItemsAreReadyAfterDeploy()
    {
        var response = RestSharpHttp.Request(Method.Get, "/api/items");
        Assert.True(Equals(200, response.Status), response.Body);
        Assert.Equal("postgresql", response.Text("source"));
        var names = response.ItemNames();
        Assert.True(
            names.Contains("Alpha") && names.Contains("Beta") && names.Contains("Gamma"),
            string.Join(", ", names));
    }
}
