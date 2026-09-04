using Allure.Net.Commons;
using Allure.Net.Commons.Attributes;
using Tests;

namespace Tests.Ui;

[AllureLabel("layer", "ui")]
[AllureEpic("Header")]
[AllureFeature("Burger menu")]
[AllureSeverity(SeverityLevel.normal)]
[AllureSuite("Burger menu")]
public sealed class BurgerMenuTests : TestBase
{
    public BurgerMenuTests() => LoginPage.Header.SetMobileViewport();

    public override void Dispose()
    {
        LoginPage.Header.ResetViewport();
        base.Dispose();
    }

    [Trait("TestCategory", "ui")]
    [Fact(DisplayName = "Menu nav marks Login active on the login page")]
    public void MenuNavMarksActiveLogin()
    {
        LoginPage.OpenPage()
            .Header.OpenMenu()
            .ShouldHaveActiveMenuNav("header-menu-nav-login");
    }

    [Trait("TestCategory", "ui")]
    [Fact(DisplayName = "Menu Register opens the register page and closes the menu")]
    public void ClickingRegisterOpensRegisterAndClosesMenu()
    {
        LoginPage.OpenPage()
            .Header.OpenMenu()
            .ShouldHaveActiveMenuNav("header-menu-nav-login")
            .ClickMenuNav("header-menu-nav-register");
        RegisterPage.ShouldBeOpen()
            .Header.ShouldHaveClosedMenu();
    }

    [Trait("TestCategory", "ui")]
    [Fact(DisplayName = "Menu Login opens the login page and closes the menu")]
    public void ClickingLoginOpensLoginAndClosesMenu()
    {
        RegisterPage.OpenPage()
            .Header.OpenMenu()
            .ClickMenuNav("header-menu-nav-login");
        LoginPage.ShouldBeOpen()
            .Header.ShouldHaveClosedMenu();
    }
}
