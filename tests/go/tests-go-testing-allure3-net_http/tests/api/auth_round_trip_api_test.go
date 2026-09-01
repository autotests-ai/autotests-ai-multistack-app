package api_test

import (
	"net/http"
	"testing"

	tests "tests-go-testing-allure3-net_http"

	allure "github.com/allure-framework/allure-go/commons/gotest"
	"github.com/stretchr/testify/require"
)

func wrapRoundTrip(t *testing.T, name string, body func(*allure.Context)) {
	t.Helper()
	tests.Wrap(t, name, body, tests.LayerAPI("Auth account lifecycle on deployed stand", "Authentication", "Account lifecycle", "critical")...)
}

func TestAccountLifecycleRoundTrip(t *testing.T) {
	wrapRoundTrip(t, "register → login → me → logout (stateless: token survives) → delete → me is 401", func(a *allure.Context) {
		name := tests.Username()
		password := "password123"

		created := tests.Request(t, a, http.MethodPost, "/api/auth/register", tests.RequestOpt{
			JSON: map[string]string{"username": name, "password": password},
		})
		require.Equal(t, http.StatusCreated, created.Status)
		require.Equal(t, name, created.Map(t)["username"])

		loggedIn := tests.Request(t, a, http.MethodPost, "/api/auth/login", tests.RequestOpt{
			JSON: map[string]string{"username": name, "password": password},
		})
		require.Equal(t, http.StatusOK, loggedIn.Status)
		token, _ := loggedIn.Map(t)["token"].(string)
		require.NotEmpty(t, token)

		me := tests.Request(t, a, http.MethodGet, "/api/auth/me", tests.RequestOpt{Token: token})
		require.Equal(t, http.StatusOK, me.Status)
		require.Equal(t, name, me.Map(t)["username"])

		logout := tests.Request(t, a, http.MethodPost, "/api/auth/logout", tests.RequestOpt{Token: token})
		require.Equal(t, http.StatusNoContent, logout.Status)

		stillMe := tests.Request(t, a, http.MethodGet, "/api/auth/me", tests.RequestOpt{Token: token})
		require.Equal(t, http.StatusOK, stillMe.Status)
		require.Equal(t, name, stillMe.Map(t)["username"])

		deleted := tests.Request(t, a, http.MethodDelete, "/api/auth/me", tests.RequestOpt{Token: token})
		require.Equal(t, http.StatusNoContent, deleted.Status)

		gone := tests.Request(t, a, http.MethodGet, "/api/auth/me", tests.RequestOpt{Token: token})
		require.Equal(t, http.StatusUnauthorized, gone.Status)
	})
}
