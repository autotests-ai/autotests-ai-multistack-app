package e2e_test

import (
	"testing"

	tests "tests-go-testing-api_request-playwright"

	allure "github.com/allure-framework/allure-go/commons/gotest"
)

const (
	loginRequired     = "Login is required (minimum 3 characters)"
	loginMinLength    = "Login must be at least 3 characters"
	passwordRequired  = "Password is required (minimum 6 characters)"
	passwordMinLength = "Password must be at least 6 characters"
	bothRequired      = "Login and password are required (minimum 3 and 6 characters)"
	wrongCredentials  = "Wrong login or password"
)

func wrapLogin(t *testing.T, name string, body func(*allure.Context), extra ...allure.Option) {
	t.Helper()
	tests.Wrap(t, name, body, append(tests.LayerE2E("Login", "Authentication", "Login", "critical"), extra...)...)
}

func TestUserIsLoggedInWithValidCredentials(t *testing.T) {
	wrapLogin(t, "User is logged in with valid credentials", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			app.Login.Open().Login("user1", "password1")
			tests.ExpectText(t, app.Home.WelcomeMessage(), "Welcome, user1!")
		})
	}, allure.WithTag("smoke"), allure.WithTag("positive"))
}

func TestUserIsLoggedInWithMinLengthCredentials(t *testing.T) {
	wrapLogin(t, "User is logged in with 3-character login and 6-character password", func(a *allure.Context) {
		user := tests.NewUserAtMinLength()
		token := tests.Register(t, a, user.Username, user.Password)
		defer tests.DeleteAccount(t, a, token)
		tests.WithApp(t, a, func(app *tests.App) {
			app.Login.Open().Login(user.Username, user.Password)
			tests.ExpectText(t, app.Home.WelcomeMessage(), user.WelcomeMessage())
		})
	}, allure.WithTag("positive"))
}

func TestEmptyUsernameShowsValidationError(t *testing.T) {
	wrapLogin(t, "Empty username shows validation error", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			app.Login.Open().TypePassword("password1").SubmitExpectingError()
			tests.ExpectText(t, app.Login.ErrorMessage(), loginRequired)
		})
	}, allure.WithTag("negative"))
}

func TestEmptyPasswordShowsValidationError(t *testing.T) {
	wrapLogin(t, "Empty password shows validation error", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			app.Login.Open().TypeUsername("user1").SubmitExpectingError()
			tests.ExpectText(t, app.Login.ErrorMessage(), passwordRequired)
		})
	}, allure.WithTag("negative"))
}

func TestWrongPasswordShowsReadableError(t *testing.T) {
	wrapLogin(t, "Wrong password shows readable error", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			app.Login.Open().TypeUsername("user1").TypePassword("wrongpassword").SubmitExpectingError()
			tests.ExpectText(t, app.Login.ErrorMessage(), wrongCredentials)
		})
	}, allure.WithTag("negative"))
}

func TestShortUsernameShowsValidationError(t *testing.T) {
	wrapLogin(t, "Short username shows validation error", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			app.Login.Open().TypeUsername("ab").TypePassword("password1").SubmitExpectingError()
			tests.ExpectText(t, app.Login.ErrorMessage(), loginMinLength)
		})
	}, allure.WithTag("negative"))
}

func TestShortPasswordShowsValidationError(t *testing.T) {
	wrapLogin(t, "Short password shows validation error", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			app.Login.Open().TypeUsername("user1").TypePassword("123").SubmitExpectingError()
			tests.ExpectText(t, app.Login.ErrorMessage(), passwordMinLength)
		})
	}, allure.WithTag("negative"))
}

func TestUnknownUsernameShowsTheSameReadableError(t *testing.T) {
	wrapLogin(t, "Unknown username shows the same readable error", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			app.Login.Open().TypeUsername("nouser").TypePassword("password1").SubmitExpectingError()
			tests.ExpectText(t, app.Login.ErrorMessage(), wrongCredentials)
		})
	}, allure.WithTag("negative"))
}

func TestEmptyUsernameAndPasswordShowCombinedValidationError(t *testing.T) {
	wrapLogin(t, "Empty username and password show combined validation error", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			app.Login.Open().SubmitExpectingError()
			tests.ExpectText(t, app.Login.ErrorMessage(), bothRequired)
		})
	}, allure.WithTag("negative"))
}
