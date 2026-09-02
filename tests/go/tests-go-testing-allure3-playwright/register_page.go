package tests

import (
	allure "github.com/allure-framework/allure-go/commons/gotest"
	"github.com/mxschmitt/playwright-go"
	"github.com/stretchr/testify/require"
)

type RegisterPage struct {
	app  *App
	page playwright.Page
}

func (p *RegisterPage) Form() playwright.Locator {
	return p.page.GetByTestId("register-form")
}

func (p *RegisterPage) LoginInput() playwright.Locator {
	return p.page.GetByTestId("register-login-input")
}

func (p *RegisterPage) PasswordInput() playwright.Locator {
	return p.page.GetByTestId("register-password-input")
}

func (p *RegisterPage) ConfirmPasswordInput() playwright.Locator {
	return p.page.GetByTestId("confirm-password-input")
}

func (p *RegisterPage) Submit() playwright.Locator {
	return p.page.GetByTestId("register-submit-button")
}

func (p *RegisterPage) FormTitle() playwright.Locator {
	return p.page.GetByTestId("register-form-title")
}

func (p *RegisterPage) ErrorMessage() playwright.Locator {
	return p.page.GetByTestId("register-error-message")
}

func (p *RegisterPage) LoginLink() playwright.Locator {
	return p.page.GetByTestId("login-link")
}

func (p *RegisterPage) Open() *RegisterPage {
	p.app.t.Helper()
	p.app.a.Step("Open register page", func(*allure.Context) {
		_, err := p.page.Goto("register")
		require.NoError(p.app.t, err)
		p.ShouldBeOpen()
	})
	return p
}

func (p *RegisterPage) ShouldBeOpen() *RegisterPage {
	p.app.t.Helper()
	waitVisible(p.app.t, p.Form())
	return p
}

func (p *RegisterPage) ShouldShowRegisterForm() *RegisterPage {
	p.app.t.Helper()
	waitVisible(p.app.t, p.FormTitle())
	waitVisible(p.app.t, p.LoginInput())
	waitVisible(p.app.t, p.PasswordInput())
	waitVisible(p.app.t, p.ConfirmPasswordInput())
	waitVisible(p.app.t, p.Submit())
	return p
}

func (p *RegisterPage) Signup(username, password, confirm string) *RegisterPage {
	p.app.t.Helper()
	if confirm == "" {
		confirm = password
	}
	require.NoError(p.app.t, p.LoginInput().Fill(username))
	require.NoError(p.app.t, p.PasswordInput().Fill(password))
	require.NoError(p.app.t, p.ConfirmPasswordInput().Fill(confirm))
	require.NoError(p.app.t, p.Submit().Click())
	return p
}

func (p *RegisterPage) TypeUsername(username string) *RegisterPage {
	p.app.t.Helper()
	require.NoError(p.app.t, p.LoginInput().Fill(username))
	return p
}

func (p *RegisterPage) TypePassword(password string) *RegisterPage {
	p.app.t.Helper()
	require.NoError(p.app.t, p.PasswordInput().Fill(password))
	return p
}

func (p *RegisterPage) TypeConfirmPassword(password string) *RegisterPage {
	p.app.t.Helper()
	require.NoError(p.app.t, p.ConfirmPasswordInput().Fill(password))
	return p
}

func (p *RegisterPage) SubmitExpectingError() *RegisterPage {
	p.app.t.Helper()
	require.NoError(p.app.t, p.Submit().Click())
	waitVisible(p.app.t, p.ErrorMessage())
	return p
}

func (p *RegisterPage) ClickLoginLink() *RegisterPage {
	p.app.t.Helper()
	require.NoError(p.app.t, p.LoginLink().Click())
	return p
}
