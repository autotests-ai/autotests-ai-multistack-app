package e2e_test

import (
	"fmt"
	"testing"

	tests "tests-go-testing-allure3-playwright"

	allure "github.com/allure-framework/allure-go/commons/gotest"
)

func wrapWelcomeShot(t *testing.T, name string, body func(*allure.Context)) {
	t.Helper()
	tests.Wrap(t, name, body, append(tests.LayerE2E("Welcome panel screenshot", "Authentication", "Welcome panel", "minor"), allure.WithTag("screenshot"))...)
}

func TestWelcomePanelMatchesScreenshot(t *testing.T) {
	tests.SkipUnlessScreenshot(t)
	wrapWelcomeShot(t, "Welcome panel matches screenshot", func(a *allure.Context) {
		welcome := tests.LoadPlaywrightSettings().WelcomeUsername
		tests.WithApp(t, a, func(app *tests.App) {
			for _, width := range []int{390, 768, 1280} {
				app.Header.SetViewport(width, 900)
				app.Login.Open().Login("user1", "password1")
				tests.ExpectText(t, app.Home.WelcomeMessage(), "Welcome, "+welcome+"!")
				tests.CaptureAndCompare(t, a, app.Home.WelcomePanel(), "welcome-panel", width, fmt.Sprintf("welcome-panel-%d", width))
			}
		})
	})
}
