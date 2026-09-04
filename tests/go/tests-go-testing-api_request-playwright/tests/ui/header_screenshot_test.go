package ui_test

import (
	"fmt"
	"testing"

	tests "tests-go-testing-api_request-playwright"

	allure "github.com/allure-framework/allure-go/commons/gotest"
	"github.com/stretchr/testify/require"
)

func wrapHeaderShot(t *testing.T, name string, body func(*allure.Context)) {
	t.Helper()
	tests.Wrap(t, name, body, append(tests.LayerUI("Header screenshot", "Header", "Header", "minor"), allure.WithTag("screenshot"))...)
}

func TestHeaderBarMatchesScreenshot(t *testing.T) {
	tests.SkipUnlessScreenshot(t)
	wrapHeaderShot(t, "Header bar matches screenshot", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			for _, width := range []int{390, 768, 1280} {
				app.Header.SetViewport(width, 900)
				app.Login.Open()
				require.NoError(t, app.Header.Root().WaitFor())
				tests.CaptureAndCompare(t, a, app.Header.Root(), "header", width, fmt.Sprintf("header-%d", width))
				app.Header.ResetViewport()
			}
		})
	})
}
