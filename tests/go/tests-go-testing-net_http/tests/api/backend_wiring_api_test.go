package api_test

import (
	"net/http"
	"testing"

	tests "tests-go-testing-net_http"

	allure "github.com/allure-framework/allure-go/commons/gotest"
	"github.com/stretchr/testify/require"
)

func wrapWiring(t *testing.T, name string, body func(*allure.Context), extra ...allure.Option) {
	t.Helper()
	tests.Wrap(t, name, body, append(tests.LayerAPI("Backend wiring on deployed stand", "Wired backend", "Health and data source", "blocker"), extra...)...)
}

func TestHealthReportsActiveBackendService(t *testing.T) {
	wrapWiring(t, "GET /api/health — deployed service is the active backend module, not a neighbour", func(a *allure.Context) {
		res := tests.Request(t, a, http.MethodGet, "/api/health", tests.RequestOpt{})
		require.Equal(t, http.StatusOK, res.Status)
		require.Equal(t, tests.LoadConfig().APIHealthService, res.Map(t)["service"])
	}, allure.WithTag("smoke"))
}

func TestItemsAreWiredToPostgreSQL(t *testing.T) {
	wrapWiring(t, "GET /api/items — catalogue is served from PostgreSQL, not a stub or fallback", func(a *allure.Context) {
		res := tests.Request(t, a, http.MethodGet, "/api/items", tests.RequestOpt{})
		require.Equal(t, http.StatusOK, res.Status)
		require.Equal(t, "postgresql", res.Map(t)["source"])
	})
}
