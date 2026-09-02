package infra_test

import (
	"testing"

	tests "tests-go-testing-allure3-playwright"

	allure "github.com/allure-framework/allure-go/commons/gotest"
	"github.com/stretchr/testify/require"
)

func wrapLayout(t *testing.T, name string, body func(*allure.Context)) {
	t.Helper()
	tests.Wrap(t, name, body, tests.LayerInfraFrontend("LayoutCss", "Test infra", "Layout CSS", "normal")...)
}

func TestGridColumnCountParsesGridTemplateColumns(t *testing.T) {
	wrapLayout(t, "gridColumnCount parses grid-template-columns", func(a *allure.Context) {
		require.Equal(t, 3, tests.GridColumnCount("repeat(3, minmax(0, 1fr))"))
		require.Equal(t, 2, tests.GridColumnCount("603px 603px"))
		require.Equal(t, 1, tests.GridColumnCount("1fr"))
		require.Equal(t, 1, tests.GridColumnCount("316px"))
		require.Equal(t, 0, tests.GridColumnCount("none"))
		require.Equal(t, 0, tests.GridColumnCount(""))
		require.Equal(t, 0, tests.GridColumnCount("   "))
	})
}
