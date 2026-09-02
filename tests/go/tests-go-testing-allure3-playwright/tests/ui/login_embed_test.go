package ui_test

import (
	"testing"

	tests "tests-go-testing-allure3-playwright"

	allure "github.com/allure-framework/allure-go/commons/gotest"
	"github.com/stretchr/testify/require"
)

func wrapLoginEmbed(t *testing.T, name string, body func(*allure.Context)) {
	t.Helper()
	tests.Wrap(t, name, body, append(tests.LayerUI("Login embed", "Authentication", "Login embed", "normal"), allure.WithTag("mock"))...)
}

func TestEmbeddedHeaderIsVisibleOnLoginPage(t *testing.T) {
	wrapLoginEmbed(t, "Embedded header is visible on login page", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			app.Login.Open()
			require.NoError(t, app.Home.Header().WaitFor())
			tests.ExpectText(t, app.Login.FormTitle(), "Login Form")
		})
	})
}
