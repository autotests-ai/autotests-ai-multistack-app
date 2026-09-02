package tests

import (
	"strings"
	"testing"

	allure "github.com/allure-framework/allure-go/commons/gotest"
	"github.com/mxschmitt/playwright-go"
	"github.com/stretchr/testify/require"
)

type App struct {
	t            *testing.T
	a            *allure.Context
	Page         playwright.Page
	dialogAction string
	Login        *LoginPage
	Register     *RegisterPage
	Home         *HomePage
	Header       *HeaderPage
}

func newApp(t *testing.T, a *allure.Context, page playwright.Page) *App {
	app := &App{t: t, a: a, Page: page}
	app.Login = &LoginPage{app: app, page: page}
	app.Register = &RegisterPage{app: app, page: page}
	app.Home = &HomePage{app: app, page: page}
	app.Header = &HeaderPage{app: app, page: page}
	page.OnDialog(func(dialog playwright.Dialog) {
		require.Equal(t, deleteAccountConfirm, dialog.Message())
		if app.dialogAction == "dismiss" {
			require.NoError(t, dialog.Dismiss())
			return
		}
		require.NoError(t, dialog.Accept())
	})
	return app
}

func waitVisible(t *testing.T, loc playwright.Locator) {
	t.Helper()
	require.NoError(t, loc.WaitFor())
}

func innerText(t *testing.T, loc playwright.Locator) string {
	t.Helper()
	text, err := loc.InnerText()
	require.NoError(t, err)
	return text
}

func attr(t *testing.T, loc playwright.Locator, name string) string {
	t.Helper()
	value, err := loc.GetAttribute(name)
	require.NoError(t, err)
	return value
}

func hasClass(t *testing.T, loc playwright.Locator, class string) bool {
	t.Helper()
	return strings.Contains(attr(t, loc, "class"), class)
}

func Attr(t *testing.T, loc playwright.Locator, name string) string {
	t.Helper()
	return attr(t, loc, name)
}

func Text(t *testing.T, loc playwright.Locator) string {
	t.Helper()
	return innerText(t, loc)
}

func ExpectText(t *testing.T, loc playwright.Locator, needle string) {
	t.Helper()
	require.NoError(t, playwright.NewPlaywrightAssertions().Locator(loc).ToContainText(needle))
}

func ExpectAttr(t *testing.T, loc playwright.Locator, name, value string) {
	t.Helper()
	require.NoError(t, playwright.NewPlaywrightAssertions().Locator(loc).ToHaveAttribute(name, value))
}
