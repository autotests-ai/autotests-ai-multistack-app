package manual_test

import (
	"testing"

	tests "tests-go-testing-api_request-playwright"

	allure "github.com/allure-framework/allure-go/commons/gotest"
)

func wrapManual(t *testing.T, name string, body func(*allure.Context)) {
	t.Helper()
	tests.Wrap(t, name, body, tests.LayerManual("Exploratory manual", "Exploratory", "Manual checklist", "normal")...)
}

func TestHomeResidualCharter(t *testing.T) {
	wrapManual(t, "Home residual: 390px viewport and offline error", func(a *allure.Context) {
		a.Step("Open / and let health + items load", func(*allure.Context) {})
		a.Step("Narrow the viewport to 390px — cards stack, nothing overflows", func(*allure.Context) {})
		a.Step("Kill the network (offline devtools) and reload — items panel shows a readable error, not a blank page", func(*allure.Context) {})
	})
}

func TestSecurityResidualCharter(t *testing.T) {
	wrapManual(t, "Security residual: XSS, second tab, JWT expiry", func(a *allure.Context) {
		a.Step("Register with an XSS / HTML payload in the username — Welcome panel and header show escaped text, no alert", func(*allure.Context) {})
		a.Step("Sign in in a second tab, logout in the first — observe what the second tab shows on next action", func(*allure.Context) {})
		a.Step("Wait for token expiry (or shrink JWT_EXPIRATION_MS on a local stand) — expired session degrades to logged-out, not an error page", func(*allure.Context) {})
	})
}
