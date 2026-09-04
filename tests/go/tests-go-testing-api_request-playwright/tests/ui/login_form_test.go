package ui_test

import (
	"testing"

	tests "tests-go-testing-api_request-playwright"

	allure "github.com/allure-framework/allure-go/commons/gotest"
)

func wrapLoginForm(t *testing.T, name string, body func(*allure.Context)) {
	t.Helper()
	tests.Wrap(t, name, body, append(tests.LayerUI("Login form", "Authentication", "Login form", "normal"), allure.WithTag("mock"))...)
}

func TestLoginFormFieldsAndSubmitAreVisible(t *testing.T) {
	wrapLoginForm(t, "Login form fields and submit are visible", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			app.Login.Open().ShouldShowLoginForm()
			tests.ExpectText(t, app.Login.FormTitle(), "Login Form")
		})
	})
}
