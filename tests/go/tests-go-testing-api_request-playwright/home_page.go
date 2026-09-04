package tests

import (
	allure "github.com/allure-framework/allure-go/commons/gotest"
	"github.com/mxschmitt/playwright-go"
	"github.com/stretchr/testify/require"
)

const deleteAccountConfirm = "Delete this account? This cannot be undone."

type HomePage struct {
	app  *App
	page playwright.Page
}

func (p *HomePage) Layout() playwright.Locator {
	return p.page.GetByTestId("multistack-layout")
}

func (p *HomePage) HealthStatus() playwright.Locator {
	return p.page.GetByTestId("health-status")
}

func (p *HomePage) ItemsList() playwright.Locator {
	return p.page.GetByTestId("items-list")
}

func (p *HomePage) WelcomeMessage() playwright.Locator {
	return p.page.GetByTestId("welcome-message")
}

func (p *HomePage) WelcomePanel() playwright.Locator {
	return p.page.GetByTestId("welcome-panel")
}

func (p *HomePage) LogoutButton() playwright.Locator {
	return p.page.GetByTestId("logout-button")
}

func (p *HomePage) DeleteAccountButton() playwright.Locator {
	return p.page.GetByTestId("delete-account-button")
}

func (p *HomePage) Header() playwright.Locator {
	return p.page.GetByTestId("header")
}

func (p *HomePage) Open() *HomePage {
	p.app.t.Helper()
	p.app.a.Step("Open home page", func(*allure.Context) {
		_, err := p.page.Goto("./")
		require.NoError(p.app.t, err)
		p.ShouldBeOpen()
	})
	return p
}

func (p *HomePage) ShouldBeOpen() *HomePage {
	p.app.t.Helper()
	waitVisible(p.app.t, p.Layout())
	return p
}

func (p *HomePage) ShouldShowLayout() *HomePage {
	p.app.t.Helper()
	waitVisible(p.app.t, p.Layout())
	waitVisible(p.app.t, p.ItemsList())
	return p
}

func (p *HomePage) ShouldShowLayoutAndHealth() *HomePage {
	p.app.t.Helper()
	waitVisible(p.app.t, p.Layout())
	waitVisible(p.app.t, p.HealthStatus())
	return p
}

func (p *HomePage) ShouldShowSettledHealthAndItems() *HomePage {
	p.app.t.Helper()
	p.ShouldShowLayoutAndHealth()
	waitVisible(p.app.t, p.ItemsList())
	require.NotContains(p.app.t, innerText(p.app.t, p.HealthStatus()), "Checking health")
	require.NotContains(p.app.t, innerText(p.app.t, p.ItemsList()), "Loading items")
	return p
}

func (p *HomePage) Logout() *HomePage {
	p.app.t.Helper()
	require.NoError(p.app.t, p.LogoutButton().Click())
	return p
}

func (p *HomePage) Reload() *HomePage {
	p.app.t.Helper()
	_, err := p.page.Reload()
	require.NoError(p.app.t, err)
	return p.ShouldBeOpen()
}

func (p *HomePage) ClickDeleteAccountAndConfirm() *HomePage {
	p.app.t.Helper()
	p.app.dialogAction = "accept"
	require.NoError(p.app.t, p.DeleteAccountButton().Click())
	return p
}

func (p *HomePage) ClickDeleteAccountAndCancel() *HomePage {
	p.app.t.Helper()
	p.app.dialogAction = "dismiss"
	require.NoError(p.app.t, p.DeleteAccountButton().Click())
	return p
}

func (p *HomePage) OpenWithLocalStorageAuthentication(username, password string) *HomePage {
	p.app.t.Helper()
	token := Login(p.app.t, p.app.a, username, password)
	return p.OpenWithLocalStorageAuth(token)
}

func (p *HomePage) OpenWithLocalStorageAuth(token string) *HomePage {
	p.app.t.Helper()
	_, err := p.page.Goto("login")
	require.NoError(p.app.t, err)
	waitVisible(p.app.t, p.page.GetByTestId("login-form"))
	key := p.AuthTokenKey()
	_, err = p.page.Evaluate("([k, t]) => localStorage.setItem(k, t)", []any{key, token})
	require.NoError(p.app.t, err)
	return p.Open()
}

func (p *HomePage) ShouldHideWelcomePanel() *HomePage {
	p.app.t.Helper()
	ExpectAttr(p.app.t, p.WelcomePanel(), "hidden", "")
	return p
}

func (p *HomePage) ShouldClearAuthToken() *HomePage {
	p.app.t.Helper()
	_, err := p.page.WaitForFunction(`() => {
		const m = location.pathname.match(/\/(backend-[^/]+)\//);
		const key = m ? `+"`authToken:${m[1]}`"+` : 'authToken';
		return localStorage.getItem(key) === null;
	}`, nil)
	require.NoError(p.app.t, err)
	return p
}

func (p *HomePage) ShouldShowSessionActions() *HomePage {
	p.app.t.Helper()
	waitVisible(p.app.t, p.LogoutButton())
	require.Contains(p.app.t, innerText(p.app.t, p.LogoutButton()), "Logout")
	waitVisible(p.app.t, p.DeleteAccountButton())
	require.Contains(p.app.t, innerText(p.app.t, p.DeleteAccountButton()), "Delete account")
	return p
}

func (p *HomePage) OpenWithInvalidToken() *HomePage {
	return p.OpenWithLocalStorageAuth("invalid-token")
}

func (p *HomePage) AuthTokenKey() string {
	p.app.t.Helper()
	value, err := p.page.Evaluate(`() => {
		const m = location.pathname.match(/\/(backend-[^/]+)\//);
		return m ? ` + "`authToken:${m[1]}`" + ` : 'authToken';
	}`)
	require.NoError(p.app.t, err)
	s, _ := value.(string)
	return s
}

func (p *HomePage) AuthToken() *string {
	p.app.t.Helper()
	value, err := p.page.Evaluate("k => localStorage.getItem(k)", p.AuthTokenKey())
	require.NoError(p.app.t, err)
	if value == nil {
		return nil
	}
	s, _ := value.(string)
	return &s
}
