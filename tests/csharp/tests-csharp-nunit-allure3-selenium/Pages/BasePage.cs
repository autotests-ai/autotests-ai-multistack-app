using Allure.NUnit.Attributes;
using Helpers;
using OpenQA.Selenium;

namespace Pages;

public abstract class BasePage<T> where T : BasePage<T>
{
    public readonly HeaderComponent Header = new();

    public abstract T ShouldBeOpen();

    [AllureStep("Reload current page")]
    public T ReloadPage()
    {
        Ui.Refresh();
        return ShouldBeOpen();
    }
}

public sealed class HeaderComponent
{
    [AllureStep("Emulate mobile viewport (375x812)")]
    public HeaderComponent SetMobileViewport()
    {
        ViewportHelper.SetViewport(375, 812);
        return this;
    }

    [AllureStep("Reset viewport to default")]
    public HeaderComponent ResetViewport()
    {
        ViewportHelper.ResetViewport();
        return this;
    }

    [AllureStep("Desktop nav '{navTestid}' is the active item")]
    public HeaderComponent ShouldHaveActiveNav(string navTestid)
    {
        var locator = Ui.TestId(navTestid);
        Ui.ShouldBeVisible(locator);
        Ui.ShouldHaveCssClass(locator, "is-active");
        Ui.ShouldHaveAttribute(locator, "aria-current", "page");
        Ui.WaitUntil(driver =>
            Ui.All(By.CssSelector("[data-testid='header-nav'] a[aria-current='page']")).Count == 1
                ? true
                : (bool?)null);
        return this;
    }

    [AllureStep("Click header nav '{navTestid}'")]
    public HeaderComponent ClickNav(string navTestid)
    {
        Ui.Click(navTestid);
        return this;
    }

    [AllureStep("Open the burger menu")]
    public HeaderComponent OpenMenu()
    {
        Ui.Click("header-burger");
        Ui.ShouldBeVisible("header-menu");
        Ui.ShouldHaveAttribute(Ui.TestId("header-burger"), "aria-expanded", "true");
        return this;
    }

    [AllureStep("Menu nav '{menuNavTestid}' is the active item")]
    public HeaderComponent ShouldHaveActiveMenuNav(string menuNavTestid)
    {
        var locator = Ui.TestId(menuNavTestid);
        Ui.ShouldBeVisible(locator);
        Ui.ShouldHaveCssClass(locator, "is-active");
        Ui.ShouldHaveAttribute(locator, "aria-current", "page");
        return this;
    }

    [AllureStep("Click menu nav link '{menuNavTestid}'")]
    public HeaderComponent ClickMenuNav(string menuNavTestid)
    {
        Ui.Click(menuNavTestid);
        return this;
    }

    [AllureStep("Menu is closed")]
    public HeaderComponent ShouldHaveClosedMenu()
    {
        Ui.ShouldBeHidden(Ui.TestId("header-menu"));
        Ui.ShouldHaveAttribute(Ui.TestId("header-burger"), "aria-expanded", "false");
        return this;
    }

    [AllureStep("Burger menu panel is visible")]
    public IWebElement MenuPanel() => Ui.El("header-menu");

    [AllureStep("Header bar is visible")]
    public IWebElement HeaderPanel() => Ui.El("header");

    [AllureStep("Verify embedded header is mounted")]
    public HeaderComponent ShouldShowEmbeddedHeader()
    {
        Ui.ShouldBeVisible("header");
        return this;
    }

    [AllureStep("Click language toggle")]
    public HeaderComponent ClickLangToggle()
    {
        Ui.Click(By.CssSelector("[data-testid='header-tools'] [data-testid='header-lang-toggle']"));
        return this;
    }

    [AllureStep("Click theme toggle")]
    public HeaderComponent ClickThemeToggle()
    {
        Ui.Click(By.CssSelector("[data-testid='header-tools'] [data-testid='header-theme-toggle']"));
        return this;
    }

    [AllureStep("Verify language label: {label}")]
    public HeaderComponent ShouldHaveLangLabel(string label)
    {
        Ui.ShouldHaveText(By.CssSelector("[data-testid='header-tools'] [data-testid='header-lang-label']"), label);
        return this;
    }

    [AllureStep("Verify html lang: {lang}")]
    public HeaderComponent ShouldHaveHtmlLang(string lang)
    {
        Ui.ShouldHaveAttribute(By.CssSelector("html"), "lang", lang);
        return this;
    }

    [AllureStep("Verify theme: {theme}")]
    public HeaderComponent ShouldHaveTheme(string theme)
    {
        var html = By.CssSelector("html");
        if (theme == "light")
        {
            Ui.ShouldHaveCssClass(html, "theme-light");
        }
        else
        {
            Ui.ShouldNotHaveCssClass(html, "theme-light");
        }

        return this;
    }
}
