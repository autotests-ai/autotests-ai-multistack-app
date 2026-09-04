package e2e_test

import (
	"testing"

	tests "tests-go-testing-api_request-playwright"

	allure "github.com/allure-framework/allure-go/commons/gotest"
)

func wrapSession(t *testing.T, name string, body func(*allure.Context), extra ...allure.Option) {
	t.Helper()
	tests.Wrap(t, name, body, append(tests.LayerE2E("Session", "Authentication", "Session", "critical"), extra...)...)
}

func TestInvalidTokenClearsSessionAndHidesWelcome(t *testing.T) {
	wrapSession(t, "Invalid token clears session and hides welcome", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			app.Home.OpenWithInvalidToken().ShouldHideWelcomePanel().ShouldClearAuthToken()
		})
	}, allure.WithTag("negative"))
}

func TestSessionSurvivesAPageReload(t *testing.T) {
	wrapSession(t, "Session survives a page reload (token in localStorage)", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			app.Home.OpenWithLocalStorageAuthentication("user1", "password1")
			tests.ExpectText(t, app.Home.WelcomeMessage(), "Welcome, user1!")
			app.Home.Reload()
			tests.ExpectText(t, app.Home.WelcomeMessage(), "Welcome, user1!")
		})
	}, allure.WithTag("positive"))
}
