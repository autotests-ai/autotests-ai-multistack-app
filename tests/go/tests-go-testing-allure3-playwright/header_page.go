package tests

import (
	allure "github.com/allure-framework/allure-go/commons/gotest"
	"github.com/mxschmitt/playwright-go"
	"github.com/stretchr/testify/require"
)

type HeaderPage struct {
	app  *App
	page playwright.Page
}

func (p *HeaderPage) Root() playwright.Locator {
	return p.page.GetByTestId("header")
}

func (p *HeaderPage) Burger() playwright.Locator {
	return p.page.GetByTestId("header-burger")
}

func (p *HeaderPage) Menu() playwright.Locator {
	return p.page.GetByTestId("header-menu")
}

func (p *HeaderPage) LangToggle() playwright.Locator {
	return p.page.GetByTestId("header-tools").GetByTestId("header-lang-toggle")
}

func (p *HeaderPage) LangLabel() playwright.Locator {
	return p.page.GetByTestId("header-tools").GetByTestId("header-lang-label")
}

func (p *HeaderPage) ThemeToggle() playwright.Locator {
	return p.page.GetByTestId("header-tools").GetByTestId("header-theme-toggle")
}

func (p *HeaderPage) HTML() playwright.Locator {
	return p.page.Locator("html")
}

func (p *HeaderPage) CurrentPageLinks() playwright.Locator {
	return p.page.Locator("[data-testid='header-nav'] a[aria-current='page']")
}

func (p *HeaderPage) ShouldHaveActiveNav(testid string) *HeaderPage {
	p.app.t.Helper()
	item := p.page.GetByTestId(testid)
	waitVisible(p.app.t, item)
	require.Contains(p.app.t, attr(p.app.t, item, "class"), "is-active")
	ExpectAttr(p.app.t, item, "aria-current", "page")
	count, err := p.CurrentPageLinks().Count()
	require.NoError(p.app.t, err)
	require.Equal(p.app.t, 1, count)
	return p
}

func (p *HeaderPage) ShouldHaveActiveMenuNav(testid string) *HeaderPage {
	p.app.t.Helper()
	item := p.page.GetByTestId(testid)
	waitVisible(p.app.t, item)
	require.Contains(p.app.t, attr(p.app.t, item, "class"), "is-active")
	ExpectAttr(p.app.t, item, "aria-current", "page")
	return p
}

func (p *HeaderPage) ClickNav(testid string) *HeaderPage {
	p.app.t.Helper()
	require.NoError(p.app.t, p.page.GetByTestId(testid).Click())
	return p
}

func (p *HeaderPage) SetMobileViewport() *HeaderPage {
	p.app.t.Helper()
	return p.SetViewport(375, 812)
}

func (p *HeaderPage) ResetViewport() *HeaderPage {
	p.app.t.Helper()
	return p.SetViewport(1280, 720)
}

func (p *HeaderPage) SetViewport(width, height int) *HeaderPage {
	p.app.t.Helper()
	require.NoError(p.app.t, p.page.SetViewportSize(width, height))
	return p
}

func (p *HeaderPage) OpenMenu() *HeaderPage {
	p.app.t.Helper()
	p.app.a.Step("Open the burger menu", func(*allure.Context) {
		require.NoError(p.app.t, p.Burger().Click())
		waitVisible(p.app.t, p.Menu())
	})
	return p
}

func (p *HeaderPage) ClickMenuNav(testid string) *HeaderPage {
	p.app.t.Helper()
	require.NoError(p.app.t, p.page.GetByTestId(testid).Click())
	return p
}

func (p *HeaderPage) ShouldHaveClosedMenu() *HeaderPage {
	p.app.t.Helper()
	require.NoError(p.app.t, p.Menu().WaitFor(playwright.LocatorWaitForOptions{
		State: playwright.WaitForSelectorStateHidden,
	}))
	return p
}

func (p *HeaderPage) ClickLangToggle() *HeaderPage {
	p.app.t.Helper()
	require.NoError(p.app.t, p.LangToggle().Click())
	return p
}

func (p *HeaderPage) ClickThemeToggle() *HeaderPage {
	p.app.t.Helper()
	require.NoError(p.app.t, p.ThemeToggle().Click())
	return p
}
