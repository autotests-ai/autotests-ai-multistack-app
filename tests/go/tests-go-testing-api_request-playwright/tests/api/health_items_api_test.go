package api_test

import (
	"net/http"
	"testing"

	tests "tests-go-testing-api_request-playwright"

	allure "github.com/allure-framework/allure-go/commons/gotest"
	"github.com/stretchr/testify/require"
)

func wrapHealth(t *testing.T, name string, body func(*allure.Context)) {
	t.Helper()
	tests.Wrap(t, name, body, tests.LayerAPI("Health and items API", "Home", "Health and items", "normal")...)
}

func TestHealthMatchesContract(t *testing.T) {
	wrapHealth(t, "GET /api/health matches the health contract and reports ok", func(a *allure.Context) {
		res := tests.Request(t, a, http.MethodGet, "/api/health", tests.RequestOpt{})
		require.Equal(t, http.StatusOK, res.Status)
		tests.AssertSchema(t, res.Raw, "health.json")
		require.Equal(t, "ok", res.Map(t)["status"])
	})
}

func TestItemsMatchContract(t *testing.T) {
	wrapHealth(t, "GET /api/items matches the items contract (typed rows, named source)", func(a *allure.Context) {
		res := tests.Request(t, a, http.MethodGet, "/api/items", tests.RequestOpt{})
		require.Equal(t, http.StatusOK, res.Status)
		tests.AssertSchema(t, res.Raw, "items.json")
	})
}
