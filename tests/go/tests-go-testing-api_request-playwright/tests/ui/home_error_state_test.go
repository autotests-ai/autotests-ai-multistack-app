package ui_test

import (
	"testing"

	tests "tests-go-testing-api_request-playwright"

	allure "github.com/allure-framework/allure-go/commons/gotest"
)

func wrapHomeError(t *testing.T, name string, body func(*allure.Context)) {
	t.Helper()
	tests.Wrap(t, name, body, append(tests.LayerUI("Home error states (mock)", "Home", "Error states", "normal"), allure.WithTag("mock"), allure.WithTag("negative"))...)
}

func TestItemsAPIFailureShowsAReadableErrorNotABlankPage(t *testing.T) {
	wrapHomeError(t, "Items API failure shows a readable error, not a blank page", func(a *allure.Context) {
		if !tests.MockAvailable() {
			t.Skip("WireMock admin API is not exposed on this stand — error injection needs the mock profile")
		}
		tests.SetMockState(t, a, "items", "error")
		defer tests.ResetMockScenarios(t, a)
		tests.WithApp(t, a, func(app *tests.App) {
			app.Home.Open()
			tests.ExpectText(t, app.Home.ItemsList(), "✗ items: HTTP 500")
		})
	})
}

func TestHealthAPIFailureShowsAReadableErrorInTheHealthPanel(t *testing.T) {
	wrapHomeError(t, "Health API failure shows a readable error in the health panel", func(a *allure.Context) {
		if !tests.MockAvailable() {
			t.Skip("WireMock admin API is not exposed on this stand — error injection needs the mock profile")
		}
		tests.SetMockState(t, a, "health", "error")
		defer tests.ResetMockScenarios(t, a)
		tests.WithApp(t, a, func(app *tests.App) {
			app.Home.Open()
			tests.ExpectText(t, app.Home.HealthStatus(), "✗ health: HTTP 500")
		})
	})
}
