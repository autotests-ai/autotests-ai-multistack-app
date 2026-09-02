package e2e_test

import (
	"testing"

	tests "tests-go-testing-allure3-playwright"

	allure "github.com/allure-framework/allure-go/commons/gotest"
	"github.com/stretchr/testify/require"
)

func wrapDelete(t *testing.T, name string, body func(*allure.Context), extra ...allure.Option) {
	t.Helper()
	tests.Wrap(t, name, body, append(tests.LayerE2E("Delete account", "Authentication", "Delete account", "critical"), extra...)...)
}

func TestUserCanDeleteTheAccountFromHome(t *testing.T) {
	wrapDelete(t, "User can delete the account from home", func(a *allure.Context) {
		user := tests.NewUser()
		tests.WithApp(t, a, func(app *tests.App) {
			app.Register.Open().Signup(user.Username, user.Password, "")
			tests.ExpectText(t, app.Home.WelcomeMessage(), user.WelcomeMessage())
			app.Home.ClickDeleteAccountAndConfirm()
			tests.ExpectText(t, app.Login.FormTitle(), "Login Form")
		})
	}, allure.WithTag("positive"))
}

func TestCancellingTheConfirmKeepsTheSession(t *testing.T) {
	wrapDelete(t, "Cancelling the confirm keeps the session", func(a *allure.Context) {
		user := tests.NewUser()
		tests.WithApp(t, a, func(app *tests.App) {
			app.Register.Open().Signup(user.Username, user.Password, "")
			tests.ExpectText(t, app.Home.WelcomeMessage(), user.WelcomeMessage())
			app.Home.ClickDeleteAccountAndCancel()
			tests.ExpectText(t, app.Home.WelcomeMessage(), user.WelcomeMessage())
			require.NotNil(t, app.Home.AuthToken())
			app.Home.ClickDeleteAccountAndConfirm()
			tests.ExpectText(t, app.Login.FormTitle(), "Login Form")
		})
	})
}
