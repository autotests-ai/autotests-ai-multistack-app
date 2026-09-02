using Allure.Net.Commons;
using Allure.NUnit.Attributes;
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
    [Test]
    [Category("api")]
    [Category("smoke")]
    [AllureName("Flyway seed items Alpha, Beta, Gamma are present in PostgreSQL")]
    public void SeededItemsAreReadyAfterDeploy()
    {
        var response = RestSharpHttp.Request(Method.Get, "/api/items");
        Assert.That(response.Status, Is.EqualTo(200), response.Body);
        Assert.That(response.Text("source"), Is.EqualTo("postgresql"));
        var names = response.ItemNames();
        Assert.That(names, Does.Contain("Alpha").And.Contain("Beta").And.Contain("Gamma"), string.Join(", ", names));
    }
}
