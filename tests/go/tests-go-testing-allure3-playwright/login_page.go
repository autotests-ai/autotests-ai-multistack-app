package tests

import (
	allure "github.com/allure-framework/allure-go/commons/gotest"
	"github.com/mxschmitt/playwright-go"
	"github.com/stretchr/testify/require"
)

type LoginPage struct {
	app  *App
	page playwright.Page
}

func (p *LoginPage) Form() playwright.Locator {
	return p.page.GetByTestId("login-form")
}

func (p *LoginPage) LoginInput() playwright.Locator {
	return p.page.GetByTestId("login-input")
}

func (p *LoginPage) PasswordInput() playwright.Locator {
	return p.page.GetByTestId("password-input")
}

func (p *LoginPage) Submit() playwright.Locator {
	return p.page.GetByTestId("submit-button")
}

func (p *LoginPage) FormTitle() playwright.Locator {
	return p.page.GetByTestId("login-form-title")
}

func (p *LoginPage) ErrorMessage() playwright.Locator {
	return p.page.GetByTestId("error-message")
}

func (p *LoginPage) RegisterLink() playwright.Locator {
	return p.page.GetByTestId("register-link")
}

func (p *LoginPage) Open() *LoginPage {
	p.app.t.Helper()
	p.app.a.Step("Open login page", func(*allure.Context) {
		_, err := p.page.Goto("login")
		require.NoError(p.app.t, err)
		p.ShouldBeOpen()
	})
	return p
}

func (p *LoginPage) ShouldBeOpen() *LoginPage {
	p.app.t.Helper()
	waitVisible(p.app.t, p.Form())
	return p
}

func (p *LoginPage) ShouldShowLoginForm() *LoginPage {
	p.app.t.Helper()
	waitVisible(p.app.t, p.FormTitle())
	waitVisible(p.app.t, p.LoginInput())
	waitVisible(p.app.t, p.PasswordInput())
	waitVisible(p.app.t, p.Submit())
	return p
}

func (p *LoginPage) Login(username, password string) *LoginPage {
	p.app.t.Helper()
	require.NoError(p.app.t, p.LoginInput().Fill(username))
	require.NoError(p.app.t, p.PasswordInput().Fill(password))
	require.NoError(p.app.t, p.Submit().Click())
	return p
}

func (p *LoginPage) TypeUsername(username string) *LoginPage {
	p.app.t.Helper()
	require.NoError(p.app.t, p.LoginInput().Fill(username))
	return p
}

func (p *LoginPage) TypePassword(password string) *LoginPage {
	p.app.t.Helper()
	require.NoError(p.app.t, p.PasswordInput().Fill(password))
	return p
}

func (p *LoginPage) SubmitExpectingError() *LoginPage {
	p.app.t.Helper()
	require.NoError(p.app.t, p.Submit().Click())
	waitVisible(p.app.t, p.ErrorMessage())
	return p
}

func (p *LoginPage) ClickRegisterLink() *LoginPage {
	p.app.t.Helper()
	require.NoError(p.app.t, p.RegisterLink().Click())
	return p
}

func (p *LoginPage) Reload() *LoginPage {
	p.app.t.Helper()
	_, err := p.page.Reload()
	require.NoError(p.app.t, err)
	return p.ShouldBeOpen()
}
