package tests

import (
	"encoding/json"
	"testing"

	allure "github.com/allure-framework/allure-go/commons/gotest"
	"github.com/stretchr/testify/require"
)

func TestAuthAPI_LoginSeededUser(t *testing.T) {
	allure.Wrap(t, func(a *allure.Context) {
		a.Parameter("username", "user1")
		status, raw := doJSON(t, a, "POST", "/api/auth/login", map[string]string{
			"username": "user1",
			"password": "password1",
		})
		require.Equal(t, 200, status)
		var body map[string]any
		require.NoError(t, json.Unmarshal(raw, &body))
		require.Equal(t, "user1", body["username"])
		require.Equal(t, "/", body["redirectUrl"])
	},
		allure.WithEpic("Authentication"),
		allure.WithFeature("Authentication"),
		allure.WithDescription("POST /api/auth/login returns the auth contract for a seeded user"),
	)
}

func TestAuthAPI_LoginWrongPassword(t *testing.T) {
	allure.Wrap(t, func(a *allure.Context) {
		status, raw := doJSON(t, a, "POST", "/api/auth/login", map[string]string{
			"username": "user1",
			"password": "wrongpassword",
		})
		require.Equal(t, 401, status)
		var body map[string]any
		require.NoError(t, json.Unmarshal(raw, &body))
		require.Equal(t, wrongCredentialsMessage, body["message"])
	},
		allure.WithEpic("Authentication"),
		allure.WithFeature("Authentication"),
		allure.WithDescription("POST /api/auth/login rejects a wrong password with 401"),
	)
}
