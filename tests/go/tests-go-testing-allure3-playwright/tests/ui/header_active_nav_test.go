package ui_test

import (
	"testing"

	tests "tests-go-testing-allure3-playwright"

	allure "github.com/allure-framework/allure-go/commons/gotest"
)

func wrapNav(t *testing.T, name string, body func(*allure.Context), extra ...allure.Option) {
	t.Helper()
	tests.Wrap(t, name, body, append(tests.LayerUI("Header active nav", "Header", "Active nav", "normal"), extra...)...)
}

func TestLoginPageMarksLoginAsTheActiveHeaderNav(t *testing.T) {
	wrapNav(t, "Login page marks Login as the active header nav", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			app.Login.Open()
			app.Header.ShouldHaveActiveNav("header-nav-login")
		})
	}, allure.WithTag("smoke"))
}

func TestRegisterPageMarksRegisterAsTheActiveHeaderNav(t *testing.T) {
	wrapNav(t, "Register page marks Register as the active header nav", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			app.Register.Open()
			app.Header.ShouldHaveActiveNav("header-nav-register")
		})
	})
}

func TestHomePageMarksHomeAsTheActiveHeaderNav(t *testing.T) {
	wrapNav(t, "Home page marks Home as the active header nav", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			app.Home.Open()
			app.Header.ShouldHaveActiveNav("header-nav-home")
		})
	})
}

func TestInFormRegisterLinkSyncsTheActiveHeaderNav(t *testing.T) {
	wrapNav(t, "In-form Register link syncs the active header nav", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			app.Login.Open()
			app.Header.ShouldHaveActiveNav("header-nav-login")
			app.Login.ClickRegisterLink()
			app.Register.ShouldBeOpen()
			app.Header.ShouldHaveActiveNav("header-nav-register")
		})
	})
}

func TestInFormLoginLinkSyncsTheActiveHeaderNav(t *testing.T) {
	wrapNav(t, "In-form Login link syncs the active header nav", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			app.Register.Open()
			app.Header.ShouldHaveActiveNav("header-nav-register")
			app.Register.ClickLoginLink()
			app.Login.ShouldBeOpen()
			app.Header.ShouldHaveActiveNav("header-nav-login")
		})
	})
}

func TestHeaderNavRegisterOpensRegisterAndMarksItActive(t *testing.T) {
	wrapNav(t, "Header nav Register opens register and marks it active", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			app.Login.Open()
			app.Header.ClickNav("header-nav-register")
			app.Register.ShouldBeOpen()
			app.Header.ShouldHaveActiveNav("header-nav-register")
		})
	})
}

func TestHeaderNavLoginOpensLoginAndMarksItActive(t *testing.T) {
	wrapNav(t, "Header nav Login opens login and marks it active", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			app.Register.Open()
			app.Header.ClickNav("header-nav-login")
			app.Login.ShouldBeOpen()
			app.Header.ShouldHaveActiveNav("header-nav-login")
		})
	})
}
