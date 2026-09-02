package ui_test

import (
	"testing"

	tests "tests-go-testing-allure3-playwright"

	allure "github.com/allure-framework/allure-go/commons/gotest"
)

func wrapRegisterForm(t *testing.T, name string, body func(*allure.Context)) {
	t.Helper()
	tests.Wrap(t, name, body, append(tests.LayerUI("Register form", "Authentication", "Register form", "normal"), allure.WithTag("mock"))...)
}

func TestRegisterFormFieldsAndSubmitAreVisible(t *testing.T) {
	wrapRegisterForm(t, "Register form fields and submit are visible", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			app.Register.Open().ShouldShowRegisterForm()
			tests.ExpectText(t, app.Register.FormTitle(), "Register")
		})
	})
}
