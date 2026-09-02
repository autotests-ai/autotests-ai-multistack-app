package ui_test

import (
	"testing"

	tests "tests-go-testing-allure3-playwright"

	allure "github.com/allure-framework/allure-go/commons/gotest"
	"github.com/stretchr/testify/require"
)

func wrapHomeLayout(t *testing.T, name string, body func(*allure.Context)) {
	t.Helper()
	tests.Wrap(t, name, body, append(tests.LayerUI("Home layout", "Home", "Layout", "normal"), allure.WithTag("mock"))...)
}

func TestHomeShowsEmbeddedHeaderAndReferenceLayout(t *testing.T) {
	wrapHomeLayout(t, "Home shows embedded header and reference layout", func(a *allure.Context) {
		tests.WithApp(t, a, func(app *tests.App) {
			app.Home.Open()
			require.NoError(t, app.Home.Header().WaitFor())
			app.Home.ShouldShowLayout()
		})
	})
}
