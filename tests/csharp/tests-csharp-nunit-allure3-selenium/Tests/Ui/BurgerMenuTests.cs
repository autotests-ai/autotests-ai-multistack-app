using Allure.Net.Commons;
using Allure.NUnit.Attributes;
using Tests;

namespace Tests.Ui;

[AllureLabel("layer", "ui")]
[AllureEpic("Header")]
[AllureFeature("Burger menu")]
[AllureSeverity(SeverityLevel.normal)]
[AllureSuite("Burger menu")]
public sealed class BurgerMenuTests : TestBase
{
    [SetUp]
    public void SetMobileViewport() => LoginPage.Header.SetMobileViewport();

    [TearDown]
    public void ResetViewport() => LoginPage.Header.ResetViewport();

    [Test]
    [Category("ui")]
    [AllureName("Menu nav marks Login active on the login page")]
    public void MenuNavMarksActiveLogin()
    {
        LoginPage.OpenPage()
            .Header.OpenMenu()
            .ShouldHaveActiveMenuNav("header-menu-nav-login");
    }

    [Test]
    [Category("ui")]
    [AllureName("Menu Register opens the register page and closes the menu")]
    public void ClickingRegisterOpensRegisterAndClosesMenu()
    {
        LoginPage.OpenPage()
            .Header.OpenMenu()
            .ShouldHaveActiveMenuNav("header-menu-nav-login")
            .ClickMenuNav("header-menu-nav-register");
        RegisterPage.ShouldBeOpen()
            .Header.ShouldHaveClosedMenu();
    }

    [Test]
    [Category("ui")]
    [AllureName("Menu Login opens the login page and closes the menu")]
    public void ClickingLoginOpensLoginAndClosesMenu()
    {
        RegisterPage.OpenPage()
            .Header.OpenMenu()
            .ClickMenuNav("header-menu-nav-login");
        LoginPage.ShouldBeOpen()
            .Header.ShouldHaveClosedMenu();
    }
}
