package ui_test

import (
	"fmt"
	"testing"

	tests "tests-go-testing-allure3-playwright"

	allure "github.com/allure-framework/allure-go/commons/gotest"
)

func wrapLoginShot(t *testing.T, name string, body func(*allure.Context)) {
	t.Helper()
	tests.Wrap(t, name, body, append(tests.LayerUI("Login form screenshot", "Authentication", "Login form", "minor"), allure.WithTag("screenshot"))...)
}

func TestLoginFormMatchesScreenshot(t *testing.T) {
	tests.SkipUnlessScreenshot(t)
	wrapLoginShot(t, "Login form matches screenshot", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			for _, width := range []int{390, 768, 1280} {
				app.Header.SetViewport(width, 900)
				app.Login.Open()
				tests.CaptureAndCompare(t, a, app.Login.Form(), "login", width, fmt.Sprintf("login-%d", width))
			}
		})
	})
}
