package e2e_test

import (
	"testing"

	tests "tests-go-testing-api_request-playwright"

	allure "github.com/allure-framework/allure-go/commons/gotest"
)

const (
	registerLoginRequired     = "Login is required (minimum 3 characters)"
	registerLoginMinLength    = "Login must be at least 3 characters"
	registerPasswordRequired  = "Password is required (minimum 6 characters)"
	registerPasswordMinLength = "Password must be at least 6 characters"
	registerBothRequired      = "Login and password are required (minimum 3 and 6 characters)"
	passwordMismatch          = "Passwords do not match"
	duplicateUsername         = "Username already taken"
	registerPassword          = "password123"
)

func wrapRegister(t *testing.T, name string, body func(*allure.Context), extra ...allure.Option) {
	t.Helper()
	tests.Wrap(t, name, body, append(tests.LayerE2E("Register", "Authentication", "Register", "critical"), extra...)...)
}

func TestNewUserCanRegisterAndLandOnHome(t *testing.T) {
	wrapRegister(t, "New user can register and land on home", func(a *allure.Context) {
		user := tests.NewUser()
		tests.WithApp(t, a, func(app *tests.App) {
			app.Register.Open().Signup(user.Username, user.Password, "")
			tests.ExpectText(t, app.Home.WelcomeMessage(), user.WelcomeMessage())
			app.Home.ClickDeleteAccountAndConfirm()
		})
	}, allure.WithTag("positive"))
}

func TestNewUserCanRegisterWithMinLengthCredentials(t *testing.T) {
	wrapRegister(t, "New user can register with 3-character login and 6-character password", func(a *allure.Context) {
		user := tests.NewUserAtMinLength()
		tests.WithApp(t, a, func(app *tests.App) {
			app.Register.Open().Signup(user.Username, user.Password, "")
			tests.ExpectText(t, app.Home.WelcomeMessage(), user.WelcomeMessage())
			app.Home.ClickDeleteAccountAndConfirm()
		})
	}, allure.WithTag("positive"))
}

func TestPasswordMismatchShowsValidationError(t *testing.T) {
	wrapRegister(t, "Password mismatch shows validation error", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			app.Register.Open().TypeUsername("newuser").TypePassword("password123").TypeConfirmPassword("password124").SubmitExpectingError()
			tests.ExpectText(t, app.Register.ErrorMessage(), passwordMismatch)
		})
	}, allure.WithTag("negative"))
}

func TestShortPasswordOnRegisterShowsValidationError(t *testing.T) {
	wrapRegister(t, "Short password on register shows validation error", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			app.Register.Open().TypeUsername("newuser").TypePassword("abc").TypeConfirmPassword("abc").SubmitExpectingError()
			tests.ExpectText(t, app.Register.ErrorMessage(), registerPasswordMinLength)
		})
	}, allure.WithTag("negative"))
}

func TestTakenUsernameOnRegisterShowsReadableError(t *testing.T) {
	wrapRegister(t, "Taken username on register shows readable error", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			app.Register.Open().TypeUsername("user1").TypePassword(registerPassword).TypeConfirmPassword(registerPassword).SubmitExpectingError()
			tests.ExpectText(t, app.Register.ErrorMessage(), duplicateUsername)
		})
	}, allure.WithTag("negative"))
}

func TestShortUsernameOnRegisterShowsValidationError(t *testing.T) {
	wrapRegister(t, "Short username on register shows validation error", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			app.Register.Open().TypeUsername("ab").TypePassword("password123").TypeConfirmPassword("password123").SubmitExpectingError()
			tests.ExpectText(t, app.Register.ErrorMessage(), registerLoginMinLength)
		})
	}, allure.WithTag("negative"))
}

func TestEmptyUsernameOnRegisterShowsValidationError(t *testing.T) {
	wrapRegister(t, "Empty username on register shows validation error", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			app.Register.Open().TypePassword("password123").TypeConfirmPassword("password123").SubmitExpectingError()
			tests.ExpectText(t, app.Register.ErrorMessage(), registerLoginRequired)
		})
	}, allure.WithTag("negative"))
}

func TestEmptyPasswordOnRegisterShowsValidationError(t *testing.T) {
	wrapRegister(t, "Empty password on register shows validation error", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			app.Register.Open().TypeUsername("newuser").SubmitExpectingError()
			tests.ExpectText(t, app.Register.ErrorMessage(), registerPasswordRequired)
		})
	}, allure.WithTag("negative"))
}

func TestEmptyUsernameAndPasswordOnRegisterShowCombinedValidationError(t *testing.T) {
	wrapRegister(t, "Empty username and password on register show combined validation error", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			app.Register.Open().SubmitExpectingError()
			tests.ExpectText(t, app.Register.ErrorMessage(), registerBothRequired)
		})
	}, allure.WithTag("negative"))
}
