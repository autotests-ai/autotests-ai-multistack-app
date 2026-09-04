using System.Text.RegularExpressions;
using Allure.Net.Commons.Attributes;
using Helpers;
using Microsoft.Playwright;

namespace Pages;

public sealed class HeaderPage
{
    private static readonly Regex IsActive = new("is-active");

    private readonly IPage _page;
    public readonly ILocator Root;
    public readonly ILocator Burger;
    public readonly ILocator Menu;
    public readonly ILocator LangToggle;
    public readonly ILocator LangLabel;
    public readonly ILocator ThemeToggle;
    public readonly ILocator Html;

    public HeaderPage(IPage page)
    {
        _page = page;
        Root = page.GetByTestId("header");
        Burger = page.GetByTestId("header-burger");
        Menu = page.GetByTestId("header-menu");
        var tools = page.GetByTestId("header-tools");
        LangToggle = tools.GetByTestId("header-lang-toggle");
        LangLabel = tools.GetByTestId("header-lang-label");
        ThemeToggle = tools.GetByTestId("header-theme-toggle");
        Html = page.Locator("html");
    }

    public ILocator ActiveNav(string testid) => _page.GetByTestId(testid);

    public ILocator CurrentPageLinks() =>
        _page.Locator("[data-testid='header-nav'] a[aria-current='page']");

    public ILocator MenuNav(string testid) => _page.GetByTestId(testid);

    [AllureStep("Desktop nav '{navTestid}' is the active item")]
    public HeaderPage ShouldHaveActiveNav(string navTestid)
    {
        var item = ActiveNav(navTestid);
        Pw.Run(Assertions.Expect(item).ToBeVisibleAsync());
        Pw.Run(Assertions.Expect(item).ToHaveClassAsync(IsActive));
        Pw.Run(Assertions.Expect(item).ToHaveAttributeAsync("aria-current", "page"));
        Pw.Run(Assertions.Expect(CurrentPageLinks()).ToHaveCountAsync(1));
        return this;
    }

    [AllureStep("Menu nav '{menuNavTestid}' is the active item")]
    public HeaderPage ShouldHaveActiveMenuNav(string menuNavTestid)
    {
        var item = MenuNav(menuNavTestid);
        Pw.Run(Assertions.Expect(item).ToBeVisibleAsync());
        Pw.Run(Assertions.Expect(item).ToHaveClassAsync(IsActive));
        Pw.Run(Assertions.Expect(item).ToHaveAttributeAsync("aria-current", "page"));
        return this;
    }

    [AllureStep("Click header nav {testid}")]
    public HeaderPage ClickNav(string testid)
    {
        Pw.Run(ActiveNav(testid).ClickAsync());
        return this;
    }

    [AllureStep("Emulate mobile viewport (375x812)")]
    public HeaderPage SetMobileViewport()
    {
        ViewportHelper.SetViewport(375, 812);
        return this;
    }

    [AllureStep("Reset viewport to default")]
    public HeaderPage ResetViewport()
    {
        ViewportHelper.ResetViewport();
        return this;
    }

    [AllureStep("Open the burger menu")]
    public HeaderPage OpenMenu()
    {
        Pw.Run(Burger.ClickAsync());
        Pw.Run(Menu.WaitForAsync());
        return this;
    }

    [AllureStep("Click menu nav link {testid}")]
    public HeaderPage ClickMenuNav(string testid)
    {
        Pw.Run(MenuNav(testid).ClickAsync());
        return this;
    }

    [AllureStep("Wait until the burger menu is closed")]
    public HeaderPage ShouldHaveClosedMenu()
    {
        Pw.Run(Menu.WaitForAsync(new LocatorWaitForOptions { State = WaitForSelectorState.Hidden }));
        return this;
    }

    [AllureStep("Click language toggle")]
    public HeaderPage ClickLangToggle()
    {
        Pw.Run(LangToggle.ClickAsync());
        return this;
    }

    [AllureStep("Click theme toggle")]
    public HeaderPage ClickThemeToggle()
    {
        Pw.Run(ThemeToggle.ClickAsync());
        return this;
    }

    [AllureStep("Burger menu panel is visible")]
    public ILocator MenuPanel() => Menu;

    [AllureStep("Header bar is visible")]
    public ILocator HeaderPanel() => Root;

    [AllureStep("Verify embedded header is mounted")]
    public HeaderPage ShouldShowEmbeddedHeader()
    {
        Pw.Run(Root.WaitForAsync());
        return this;
    }

    [AllureStep("Verify language label: {label}")]
    public HeaderPage ShouldHaveLangLabel(string label)
    {
        Pw.Run(Assertions.Expect(LangLabel).ToContainTextAsync(label));
        return this;
    }

    [AllureStep("Verify html lang: {lang}")]
    public HeaderPage ShouldHaveHtmlLang(string lang)
    {
        Pw.Run(Assertions.Expect(Html).ToHaveAttributeAsync("lang", lang));
        return this;
    }

    [AllureStep("Verify theme: {theme}")]
    public HeaderPage ShouldHaveTheme(string theme)
    {
        if (theme == "light")
        {
            Pw.Run(Assertions.Expect(Html).ToHaveClassAsync(new Regex("theme-light")));
        }
        else
        {
            Pw.Run(Assertions.Expect(Html).Not.ToHaveClassAsync(new Regex("theme-light")));
        }

        return this;
    }
}
