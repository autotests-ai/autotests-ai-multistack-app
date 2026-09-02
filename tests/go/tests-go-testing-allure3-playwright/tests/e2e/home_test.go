package e2e_test

import (
	"testing"

	tests "tests-go-testing-allure3-playwright"

	allure "github.com/allure-framework/allure-go/commons/gotest"
)

func wrapHome(t *testing.T, name string, body func(*allure.Context), extra ...allure.Option) {
	t.Helper()
	tests.Wrap(t, name, body, append(tests.LayerE2E("Home", "Home", "Health and items", "critical"), extra...)...)
}

func TestHomeLoadsHealthAndSeedItems(t *testing.T) {
	wrapHome(t, "Home loads health and seed items", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			app.Home.Open()
			tests.ExpectText(t, app.Home.HealthStatus(), "service: "+tests.LoadConfig().APIHealthService)
			tests.ExpectText(t, app.Home.ItemsList(), "Alpha")
		})
	}, allure.WithTag("smoke"))
}
