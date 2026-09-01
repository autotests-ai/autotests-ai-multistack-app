package manual_test

import (
	"testing"

	tests "tests-go-testing-allure3"

	allure "github.com/allure-framework/allure-go/commons/gotest"
)

func wrapManual(t *testing.T, name string, body func(*allure.Context)) {
	t.Helper()
	tests.Wrap(t, name, body, tests.LayerManual("Exploratory manual", "Exploratory", "Manual checklist", "normal")...)
}

func TestAuthHappyPathChecklist(t *testing.T) {
	wrapManual(t, "Auth happy path across login → home → logout", func(a *allure.Context) {
		a.Step("Open /login and sign in as seeded user1 / password1", func(*allure.Context) {})
		a.Step("Confirm welcome panel shows Welcome, user1!", func(*allure.Context) {})
		a.Step("Logout and land on /login with empty session", func(*allure.Context) {})
	})
}

func TestItemsCatalogueCharter(t *testing.T) {
	wrapManual(t, "Items catalogue: content, order and resilience charter", func(a *allure.Context) {
		a.Step("Open / and let health + items load", func(*allure.Context) {})
		a.Step("Check items render Alpha, Beta, Gamma in stable id order with descriptions", func(*allure.Context) {})
		a.Step("Narrow the viewport to 390px — cards stack, nothing overflows", func(*allure.Context) {})
		a.Step("Kill the network (offline devtools) and reload — items panel shows a readable error, not a blank page", func(*allure.Context) {})
	})
}

func TestSessionTokenCharter(t *testing.T) {
	wrapManual(t, "Session and token edge cases charter", func(a *allure.Context) {
		a.Step("Sign in, reload — welcome survives (token in localStorage)", func(*allure.Context) {})
		a.Step("Replace the stored token with garbage in devtools, reload — session is cleared, no crash", func(*allure.Context) {})
		a.Step("Sign in in a second tab, logout in the first — observe what the second tab shows on next action", func(*allure.Context) {})
		a.Step("Wait for token expiry (or shrink JWT_EXPIRATION_MS on a local stand) — expired session degrades to logged-out, not an error page", func(*allure.Context) {})
	})
}
