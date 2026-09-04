package api_test

import (
	"net/http"
	"testing"

	tests "tests-go-testing-api_request-playwright"

	allure "github.com/allure-framework/allure-go/commons/gotest"
	"github.com/stretchr/testify/require"
)

func wrapSeed(t *testing.T, name string, body func(*allure.Context), extra ...allure.Option) {
	t.Helper()
	tests.Wrap(t, name, body, append(tests.LayerAPI("Seed data on deployed stand", "Deploy readiness", "Seed data", "critical"), extra...)...)
}

func TestSeededItemsAreReadyAfterDeploy(t *testing.T) {
	wrapSeed(t, "Flyway seed items Alpha, Beta, Gamma are present in PostgreSQL", func(a *allure.Context) {
		res := tests.Request(t, a, http.MethodGet, "/api/items", tests.RequestOpt{})
		require.Equal(t, http.StatusOK, res.Status)
		body := res.Map(t)
		require.Equal(t, "postgresql", body["source"])
		require.Subset(t, tests.ItemNames(t, body), []string{"Alpha", "Beta", "Gamma"})
	}, allure.WithTag("smoke"))
}
