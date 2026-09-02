package ui_test

import (
	"testing"

	tests "tests-go-testing-allure3-playwright"

	allure "github.com/allure-framework/allure-go/commons/gotest"
	"github.com/stretchr/testify/require"
)

func wrapHeader(t *testing.T, name string, body func(*allure.Context)) {
	t.Helper()
	tests.Wrap(t, name, body, tests.LayerUI("Header", "Header", "Lang and theme", "normal")...)
}

func TestLoginPageStaysEnglishByDefault(t *testing.T) {
	wrapHeader(t, "Login page stays English by default", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			app.Login.Open()
			tests.ExpectText(t, app.Login.FormTitle(), "Login Form")
			tests.ExpectText(t, app.Header.LangLabel(), "EN")
			require.Equal(t, "en", tests.Attr(t, app.Header.HTML(), "lang"))
		})
	})
}

func TestThemeTogglePersistsLightThemeAfterReload(t *testing.T) {
	wrapHeader(t, "Theme toggle persists light theme after reload", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			app.Login.Open()
			tests.ExpectText(t, app.Login.FormTitle(), "Login Form")
			require.NotContains(t, tests.Attr(t, app.Header.HTML(), "class"), "theme-light")
			app.Header.ClickThemeToggle()
			require.Contains(t, tests.Attr(t, app.Header.HTML(), "class"), "theme-light")
			app.Login.Reload()
			require.Contains(t, tests.Attr(t, app.Header.HTML(), "class"), "theme-light")
		})
	})
}

func TestLangToggleSwitchesLoginCopyToRussianAndBack(t *testing.T) {
	wrapHeader(t, "Lang toggle switches login copy to Russian and back", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			app.Login.Open()
			tests.ExpectText(t, app.Login.FormTitle(), "Login Form")
			app.Header.ClickLangToggle()
			tests.ExpectText(t, app.Header.LangLabel(), "RU")
			require.Equal(t, "ru", tests.Attr(t, app.Header.HTML(), "lang"))
			tests.ExpectText(t, app.Login.FormTitle(), "Форма входа")
			app.Login.Reload()
			tests.ExpectText(t, app.Header.LangLabel(), "RU")
			require.Equal(t, "ru", tests.Attr(t, app.Header.HTML(), "lang"))
			tests.ExpectText(t, app.Login.FormTitle(), "Форма входа")
			app.Header.ClickLangToggle()
			tests.ExpectText(t, app.Header.LangLabel(), "EN")
			require.Equal(t, "en", tests.Attr(t, app.Header.HTML(), "lang"))
			tests.ExpectText(t, app.Login.FormTitle(), "Login Form")
		})
	})
}
