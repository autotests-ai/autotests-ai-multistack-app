using Allure.Net.Commons;
using Allure.NUnit.Attributes;
using Tests;

namespace Tests.Ui;

[AllureLabel("layer", "ui")]
[AllureEpic("Header")]
[AllureFeature("Active nav")]
[AllureSeverity(SeverityLevel.normal)]
[AllureSuite("Header active nav")]
public sealed class HeaderActiveNavTests : TestBase
{
    [Test]
    [Category("ui")]
    [Category("smoke")]
    [AllureName("Login page marks Login as the active header nav")]
    public void LoginPageMarksActiveLogin()
    {
        LoginPage.OpenPage()
            .Header.ShouldHaveActiveNav("header-nav-login");
    }

    [Test]
    [Category("ui")]
    [AllureName("Register page marks Register as the active header nav")]
    public void RegisterPageMarksActiveRegister()
    {
        RegisterPage.OpenPage()
            .Header.ShouldHaveActiveNav("header-nav-register");
    }

    [Test]
    [Category("ui")]
    [AllureName("Home page marks Home as the active header nav")]
    public void HomePageMarksActiveHome()
    {
        HomePage.OpenPage()
            .Header.ShouldHaveActiveNav("header-nav-home");
    }

    [Test]
    [Category("ui")]
    [AllureName("In-form Register link syncs the active header nav")]
    public void InFormRegisterLinkSyncsActiveNav()
    {
        LoginPage.OpenPage()
            .Header.ShouldHaveActiveNav("header-nav-login");
        LoginPage.ClickRegisterLink()
            .ShouldBeOpen()
            .Header.ShouldHaveActiveNav("header-nav-register");
    }

    [Test]
    [Category("ui")]
    [AllureName("In-form Login link syncs the active header nav")]
    public void InFormLoginLinkSyncsActiveNav()
    {
        RegisterPage.OpenPage()
            .Header.ShouldHaveActiveNav("header-nav-register");
        RegisterPage.ClickLoginLink()
            .ShouldBeOpen()
            .Header.ShouldHaveActiveNav("header-nav-login");
    }

    [Test]
    [Category("ui")]
    [AllureName("Header nav Register opens register and marks it active")]
    public void HeaderNavRegisterOpensRegister()
    {
        LoginPage.OpenPage()
            .Header.ClickNav("header-nav-register");
        RegisterPage.ShouldBeOpen()
            .Header.ShouldHaveActiveNav("header-nav-register");
    }

    [Test]
    [Category("ui")]
    [AllureName("Header nav Login opens login and marks it active")]
    public void HeaderNavLoginOpensLogin()
    {
        RegisterPage.OpenPage()
            .Header.ClickNav("header-nav-login");
        LoginPage.ShouldBeOpen()
            .Header.ShouldHaveActiveNav("header-nav-login");
    }
}
