package ui_test

import (
	"testing"

	tests "tests-go-testing-api_request-playwright"

	allure "github.com/allure-framework/allure-go/commons/gotest"
	"github.com/stretchr/testify/require"
)

func wrapBurger(t *testing.T, name string, body func(*allure.Context)) {
	t.Helper()
	tests.Wrap(t, name, body, tests.LayerUI("Burger menu", "Header", "Burger menu", "normal")...)
}

func TestMenuNavMarksLoginActiveOnTheLoginPage(t *testing.T) {
	wrapBurger(t, "Menu nav marks Login active on the login page", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			app.Header.SetMobileViewport()
			defer app.Header.ResetViewport()
			app.Login.Open()
			app.Header.OpenMenu()
			app.Header.ShouldHaveActiveMenuNav("header-menu-nav-login")
		})
	})
}

func TestMenuRegisterOpensTheRegisterPageAndClosesTheMenu(t *testing.T) {
	wrapBurger(t, "Menu Register opens the register page and closes the menu", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			app.Header.SetMobileViewport()
			defer app.Header.ResetViewport()
			app.Login.Open()
			app.Header.OpenMenu()
			app.Header.ShouldHaveActiveMenuNav("header-menu-nav-login")
			app.Header.ClickMenuNav("header-menu-nav-register")
			app.Register.ShouldBeOpen()
			app.Header.ShouldHaveClosedMenu()
			require.Equal(t, "false", tests.Attr(t, app.Header.Burger(), "aria-expanded"))
		})
	})
}

func TestMenuLoginOpensTheLoginPageAndClosesTheMenu(t *testing.T) {
	wrapBurger(t, "Menu Login opens the login page and closes the menu", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			app.Header.SetMobileViewport()
			defer app.Header.ResetViewport()
			app.Register.Open()
			app.Header.OpenMenu()
			app.Header.ClickMenuNav("header-menu-nav-login")
			app.Login.ShouldBeOpen()
			app.Header.ShouldHaveClosedMenu()
			require.Equal(t, "false", tests.Attr(t, app.Header.Burger(), "aria-expanded"))
		})
	})
}
