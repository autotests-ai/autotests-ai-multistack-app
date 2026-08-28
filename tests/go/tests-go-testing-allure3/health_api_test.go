package tests

import (
	"encoding/json"
	"testing"

	allure "github.com/allure-framework/allure-go/commons/gotest"
	"github.com/stretchr/testify/require"
)

func TestHealthAPI_OK(t *testing.T) {
	allure.Wrap(t, func(a *allure.Context) {
		status, raw := doJSON(t, a, "GET", "/api/health", nil)
		require.Equal(t, 200, status)
		var body map[string]any
		require.NoError(t, json.Unmarshal(raw, &body))
		require.Equal(t, "ok", body["status"])
	},
		allure.WithEpic("Home"),
		allure.WithFeature("Health and items"),
		allure.WithDescription("GET /api/health matches the health contract and reports ok"),
	)
}

func TestItemsAPI_OK(t *testing.T) {
	allure.Wrap(t, func(a *allure.Context) {
		status, raw := doJSON(t, a, "GET", "/api/items", nil)
		require.Equal(t, 200, status)
		var body any
		require.NoError(t, json.Unmarshal(raw, &body))
	},
		allure.WithEpic("Home"),
		allure.WithFeature("Health and items"),
		allure.WithDescription("GET /api/items returns a JSON catalogue"),
	)
}
