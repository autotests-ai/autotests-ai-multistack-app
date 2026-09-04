using Allure.Net.Commons;
using Allure.Net.Commons.Attributes;
using Api;
using Api.Models;
using Helpers;
using Tests;

namespace Tests.Api;

[AllureEpic("Authentication")]
[AllureFeature("Account lifecycle")]
[AllureSeverity(SeverityLevel.critical)]
[AllureSuite("Auth account lifecycle on deployed stand")]
public sealed class AuthRoundTripApiTests : ApiTestBase
{
    /// <summary>
    /// Full account lifecycle across separate HTTP requests — proves DB and JWT are wired
    /// together on the deployed stand, and documents that logout is stateless: the JWT keeps
    /// working until the account itself is gone. Deletes the user it registers, so the stand
    /// does not accumulate test accounts.
    /// </summary>
    [Trait("TestCategory", "api")]
    [Fact(DisplayName = "register → login → me → logout (stateless: token survives) → delete → me is 401")]
    public void AccountLifecycleRoundTrip()
    {
        var username = DataFaker.Username();
        const string password = "password123";

        var registered = PlaywrightHttp.Request(
            "POST",
            "/api/auth/register",
            json: new RegisterRequest(username, password));
        Assert.True(Equals(201, registered.Status), registered.Body);
        Assert.Equal(username, registered.Text("username"));

        var login = PlaywrightHttp.Request(
            "POST",
            "/api/auth/login",
            json: new LoginRequest(username, password));
        Assert.True(Equals(200, login.Status), login.Body);
        var token = login.Text("token");

        var me = PlaywrightHttp.Request("GET", "/api/auth/me", token: token);
        Assert.True(Equals(200, me.Status), me.Body);
        Assert.Equal(username, me.Text("username"));

        var logout = PlaywrightHttp.Request("POST", "/api/auth/logout", token: token);
        Assert.True(Equals(204, logout.Status), logout.Body);

        // Stateless JWT: logout does not invalidate the token server-side — by design.
        var meAfterLogout = PlaywrightHttp.Request("GET", "/api/auth/me", token: token);
        Assert.True(Equals(200, meAfterLogout.Status), meAfterLogout.Body);
        Assert.Equal(username, meAfterLogout.Text("username"));

        var deleted = PlaywrightHttp.Request("DELETE", "/api/auth/me", token: token);
        Assert.True(Equals(204, deleted.Status), deleted.Body);

        // The token still verifies cryptographically, but the account is gone → 401.
        var meAfterDelete = PlaywrightHttp.Request("GET", "/api/auth/me", token: token);
        Assert.True(Equals(401, meAfterDelete.Status), meAfterDelete.Body);
    }
}
