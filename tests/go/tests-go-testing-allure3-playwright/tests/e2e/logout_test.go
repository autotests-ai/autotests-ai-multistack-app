package e2e_test

import (
	"testing"

	tests "tests-go-testing-allure3-playwright"

	allure "github.com/allure-framework/allure-go/commons/gotest"
)

func wrapLogout(t *testing.T, name string, body func(*allure.Context), extra ...allure.Option) {
	t.Helper()
	tests.Wrap(t, name, body, append(tests.LayerE2E("Logout", "Authentication", "Logout", "critical"), extra...)...)
}

func TestUserCanLogoutAfterFormLogin(t *testing.T) {
	wrapLogout(t, "User can logout after form login", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			app.Login.Open().Login("user1", "password1")
			tests.ExpectText(t, app.Home.WelcomeMessage(), "Welcome, user1!")
			app.Home.Logout()
			tests.ExpectText(t, app.Login.FormTitle(), "Login Form")
		})
	}, allure.WithTag("positive"))
}

func TestUserCanLogoutAfterLocalStorageAuthentication(t *testing.T) {
	wrapLogout(t, "User can logout after localStorage authentication", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			app.Home.OpenWithLocalStorageAuthentication("user1", "password1").ShouldShowSessionActions()
			tests.ExpectText(t, app.Home.WelcomeMessage(), "Welcome, user1!")
			app.Home.Logout()
			tests.ExpectText(t, app.Login.FormTitle(), "Login Form")
		})
	}, allure.WithTag("positive"))
}
