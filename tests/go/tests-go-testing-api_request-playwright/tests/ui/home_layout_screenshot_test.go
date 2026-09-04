package ui_test

import (
	"testing"

	tests "tests-go-testing-api_request-playwright"

	allure "github.com/allure-framework/allure-go/commons/gotest"
)

func wrapHomeShot(t *testing.T, name string, body func(*allure.Context)) {
	t.Helper()
	tests.Wrap(t, name, body, append(tests.LayerUI("Home layout screenshot", "Home", "Home layout", "minor"), allure.WithTag("screenshot"))...)
}

func TestHomeLayoutMatchesScreenshotAt1280px(t *testing.T) {
	tests.SkipUnlessScreenshot(t)
	wrapHomeShot(t, "Home layout matches screenshot at 1280px", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			app.Header.SetViewport(1280, 900)
			app.Home.Open().ShouldShowSettledHealthAndItems()
			tests.CaptureAndCompare(t, a, app.Home.Layout(), "home-layout", 1280, "home-layout-1280")
		})
	})
}
