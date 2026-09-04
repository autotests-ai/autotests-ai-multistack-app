using Allure.Net.Commons;
using Allure.NUnit.Attributes;
using Api;
using Api.Models;
using Helpers;
using RestSharp;
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
    [Test]
    [Category("api")]
    [AllureName("register → login → me → logout (stateless: token survives) → delete → me is 401")]
    public void AccountLifecycleRoundTrip()
    {
        var username = DataFaker.Username();
        const string password = "password123";

        var registered = RestSharpHttp.Request(
            Method.Post,
            "/api/auth/register",
            json: new RegisterRequest(username, password));
        Assert.That(registered.Status, Is.EqualTo(201), registered.Body);
        Assert.That(registered.Text("username"), Is.EqualTo(username));

        var login = RestSharpHttp.Request(
            Method.Post,
            "/api/auth/login",
            json: new LoginRequest(username, password));
        Assert.That(login.Status, Is.EqualTo(200), login.Body);
        var token = login.Text("token");

        var me = RestSharpHttp.Request(Method.Get, "/api/auth/me", token: token);
        Assert.That(me.Status, Is.EqualTo(200), me.Body);
        Assert.That(me.Text("username"), Is.EqualTo(username));

        var logout = RestSharpHttp.Request(Method.Post, "/api/auth/logout", token: token);
        Assert.That(logout.Status, Is.EqualTo(204), logout.Body);

        // Stateless JWT: logout does not invalidate the token server-side — by design.
        var meAfterLogout = RestSharpHttp.Request(Method.Get, "/api/auth/me", token: token);
        Assert.That(meAfterLogout.Status, Is.EqualTo(200), meAfterLogout.Body);
        Assert.That(meAfterLogout.Text("username"), Is.EqualTo(username));

        var deleted = RestSharpHttp.Request(Method.Delete, "/api/auth/me", token: token);
        Assert.That(deleted.Status, Is.EqualTo(204), deleted.Body);

        // The token still verifies cryptographically, but the account is gone → 401.
        var meAfterDelete = RestSharpHttp.Request(Method.Get, "/api/auth/me", token: token);
        Assert.That(meAfterDelete.Status, Is.EqualTo(401), meAfterDelete.Body);
    }
}
