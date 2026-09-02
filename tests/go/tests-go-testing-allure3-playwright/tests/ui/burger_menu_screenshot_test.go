package ui_test

import (
	"fmt"
	"testing"

	tests "tests-go-testing-allure3-playwright"

	allure "github.com/allure-framework/allure-go/commons/gotest"
)

func wrapBurgerShot(t *testing.T, name string, body func(*allure.Context)) {
	t.Helper()
	tests.Wrap(t, name, body, append(tests.LayerUI("Burger menu screenshot", "Header", "Burger menu", "minor"), allure.WithTag("screenshot"))...)
}

func TestOpenBurgerMenuMatchesScreenshot(t *testing.T) {
	tests.SkipUnlessScreenshot(t)
	wrapBurgerShot(t, "Open burger menu matches screenshot", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			for _, width := range []int{390, 768} {
				app.Header.SetViewport(width, 900)
				app.Login.Open()
				app.Header.OpenMenu()
				tests.CaptureAndCompare(t, a, app.Header.Menu(), "burger-menu", width, fmt.Sprintf("burger-menu-%d", width))
				app.Header.ResetViewport()
			}
		})
	})
}
