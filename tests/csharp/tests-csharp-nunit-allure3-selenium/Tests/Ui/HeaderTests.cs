using Allure.Net.Commons;
using Allure.NUnit.Attributes;
using Tests;

namespace Tests.Ui;

[AllureLabel("layer", "ui")]
[AllureEpic("Header")]
[AllureFeature("Lang and theme")]
[AllureSeverity(SeverityLevel.normal)]
[AllureSuite("Header")]
public sealed class HeaderTests : TestBase
{
    [Test]
    [Category("ui")]
    [AllureName("Login page stays English by default")]
    public void LoginPageStaysEnglishByDefault()
    {
        LoginPage.OpenPage()
            .ShouldHaveFormTitle("Login Form")
            .Header.ShouldHaveLangLabel("EN")
            .ShouldHaveHtmlLang("en");
    }

    [Test]
    [Category("ui")]
    [AllureName("Theme toggle persists light theme after reload")]
    public void ThemeTogglePersistsLightThemeAfterReload()
    {
        LoginPage.OpenPage()
            .ShouldHaveFormTitle("Login Form")
            .Header.ShouldHaveTheme("dark")
            .ClickThemeToggle()
            .ShouldHaveTheme("light");
        LoginPage.ReloadPage()
            .Header.ShouldHaveTheme("light");
    }

    [Test]
    [Category("ui")]
    [AllureName("Lang toggle switches login copy to Russian and back")]
    public void LangToggleSwitchesLoginCopyToRussianAndBack()
    {
        LoginPage.OpenPage()
            .ShouldHaveFormTitle("Login Form")
            .Header.ClickLangToggle()
            .ShouldHaveLangLabel("RU")
            .ShouldHaveHtmlLang("ru");
        LoginPage.ShouldHaveFormTitle("Форма входа")
            .ReloadPage()
            .Header.ShouldHaveLangLabel("RU")
            .ShouldHaveHtmlLang("ru");
        LoginPage.ShouldHaveFormTitle("Форма входа")
            .Header.ClickLangToggle()
            .ShouldHaveLangLabel("EN")
            .ShouldHaveHtmlLang("en");
        LoginPage.ShouldHaveFormTitle("Login Form");
    }
}
