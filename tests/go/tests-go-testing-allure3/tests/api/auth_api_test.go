package api_test

import (
	"net/http"
	"testing"

	tests "tests-go-testing-allure3"

	allure "github.com/allure-framework/allure-go/commons/gotest"
	"github.com/stretchr/testify/require"
)

func wrapAuth(t *testing.T, name string, body func(*allure.Context), extra ...allure.Option) {
	t.Helper()
	tests.Wrap(t, name, body, append(tests.LayerAPI("Auth API", "Authentication", "Authentication", "critical"), extra...)...)
}

func TestLoginWithValidCredentials(t *testing.T) {
	wrapAuth(t, "POST /api/auth/login returns the auth contract for a seeded user", func(a *allure.Context) {
		res := tests.Request(t, a, http.MethodPost, "/api/auth/login", tests.RequestOpt{
			JSON: map[string]string{"username": "user1", "password": "password1"},
		})
		require.Equal(t, http.StatusOK, res.Status)
		tests.AssertSchema(t, res.Raw, "auth-response.json")
		body := res.Map(t)
		require.Equal(t, "user1", body["username"])
		require.Equal(t, "/", body["redirectUrl"])
	}, allure.WithTag("smoke"))
}

func TestLoginWithInvalidPassword(t *testing.T) {
	wrapAuth(t, "POST /api/auth/login rejects a wrong password with 401", func(a *allure.Context) {
		res := tests.Request(t, a, http.MethodPost, "/api/auth/login", tests.RequestOpt{
			JSON: map[string]string{"username": "user1", "password": "wrongpassword"},
		})
		require.Equal(t, http.StatusUnauthorized, res.Status)
		tests.AssertSchema(t, res.Raw, "error.json")
		require.Equal(t, tests.WrongCredentialsMessage, tests.Message(t, res.Map(t)))
	})
}

func TestLoginWithUnknownUsername(t *testing.T) {
	wrapAuth(t, "POST /api/auth/login answers an unknown user with the same 401 (no enumeration)", func(a *allure.Context) {
		res := tests.Request(t, a, http.MethodPost, "/api/auth/login", tests.RequestOpt{
			JSON: map[string]string{"username": tests.Username(), "password": "password123"},
		})
		require.Equal(t, http.StatusUnauthorized, res.Status)
		require.Equal(t, tests.WrongCredentialsMessage, tests.Message(t, res.Map(t)))
	})
}

func TestLoginRejectsEmptyCredentials(t *testing.T) {
	wrapAuth(t, "POST /api/auth/login joins both field errors into one 400 message", func(a *allure.Context) {
		res := tests.Request(t, a, http.MethodPost, "/api/auth/login", tests.RequestOpt{
			JSON: map[string]string{"username": "", "password": ""},
		})
		require.Equal(t, http.StatusBadRequest, res.Status)
		tests.AssertSchema(t, res.Raw, "error.json")
		message := tests.Message(t, res.Map(t))
		require.Contains(t, message, "username")
		require.Contains(t, message, "password")
		require.Contains(t, message, "; ")
	})
}

func TestLoginRejectsShortUsername(t *testing.T) {
	wrapAuth(t, "POST /api/auth/login rejects a short username with 400", func(a *allure.Context) {
		res := tests.Request(t, a, http.MethodPost, "/api/auth/login", tests.RequestOpt{
			JSON: map[string]string{"username": "ab", "password": "password1"},
		})
		require.Equal(t, http.StatusBadRequest, res.Status)
		tests.AssertSchema(t, res.Raw, "error.json")
		require.Contains(t, tests.Message(t, res.Map(t)), "username")
	}, allure.WithTag("negative"))
}

func TestLoginRejectsShortPassword(t *testing.T) {
	wrapAuth(t, "POST /api/auth/login rejects a short password with 400", func(a *allure.Context) {
		res := tests.Request(t, a, http.MethodPost, "/api/auth/login", tests.RequestOpt{
			JSON: map[string]string{"username": "user1", "password": "123"},
		})
		require.Equal(t, http.StatusBadRequest, res.Status)
		tests.AssertSchema(t, res.Raw, "error.json")
		require.Contains(t, tests.Message(t, res.Map(t)), "password")
	}, allure.WithTag("negative"))
}

func TestLoginRejectsEmptyUsername(t *testing.T) {
	wrapAuth(t, "POST /api/auth/login rejects an empty username with 400", func(a *allure.Context) {
		res := tests.Request(t, a, http.MethodPost, "/api/auth/login", tests.RequestOpt{
			JSON: map[string]string{"username": "", "password": "password1"},
		})
		require.Equal(t, http.StatusBadRequest, res.Status)
		tests.AssertSchema(t, res.Raw, "error.json")
		require.Contains(t, tests.Message(t, res.Map(t)), "username")
	}, allure.WithTag("negative"))
}

func TestLoginRejectsEmptyPassword(t *testing.T) {
	wrapAuth(t, "POST /api/auth/login rejects an empty password with 400", func(a *allure.Context) {
		res := tests.Request(t, a, http.MethodPost, "/api/auth/login", tests.RequestOpt{
			JSON: map[string]string{"username": "user1", "password": ""},
		})
		require.Equal(t, http.StatusBadRequest, res.Status)
		tests.AssertSchema(t, res.Raw, "error.json")
		require.Contains(t, tests.Message(t, res.Map(t)), "password")
	}, allure.WithTag("negative"))
}

func TestLoginRejectsMalformedJSON(t *testing.T) {
	wrapAuth(t, "POST /api/auth/login answers a malformed JSON body with 400, not 401", func(a *allure.Context) {
		res := tests.Request(t, a, http.MethodPost, "/api/auth/login", tests.RequestOpt{Raw: "not json"})
		require.Equal(t, http.StatusBadRequest, res.Status)
		require.Equal(t, "Request body is not valid JSON", tests.Message(t, res.Map(t)))
	}, allure.WithTag("negative"))
}

func TestRegisterNewUser(t *testing.T) {
	wrapAuth(t, "POST /api/auth/register creates a user, returns the auth contract, and cleans up", func(a *allure.Context) {
		name := tests.Username()
		res := tests.Request(t, a, http.MethodPost, "/api/auth/register", tests.RequestOpt{
			JSON: map[string]string{"username": name, "password": "password123"},
		})
		require.Equal(t, http.StatusCreated, res.Status)
		tests.AssertSchema(t, res.Raw, "auth-response.json")
		body := res.Map(t)
		require.Equal(t, name, body["username"])
		require.Equal(t, "/", body["redirectUrl"])
		token, _ := body["token"].(string)
		tests.DeleteAccount(t, a, token)
	})
}

func TestRegisterDuplicateUsername(t *testing.T) {
	wrapAuth(t, "POST /api/auth/register rejects a duplicate username with 409", func(a *allure.Context) {
		res := tests.Request(t, a, http.MethodPost, "/api/auth/register", tests.RequestOpt{
			JSON: map[string]string{"username": "user1", "password": "password123"},
		})
		require.Equal(t, http.StatusConflict, res.Status)
		tests.AssertSchema(t, res.Raw, "error.json")
		require.Equal(t, "Username already taken", tests.Message(t, res.Map(t)))
	})
}

func TestRegisterRejectsShortPassword(t *testing.T) {
	wrapAuth(t, "POST /api/auth/register rejects a short password with 400", func(a *allure.Context) {
		res := tests.Request(t, a, http.MethodPost, "/api/auth/register", tests.RequestOpt{
			JSON: map[string]string{"username": "shortuser", "password": "abc"},
		})
		require.Equal(t, http.StatusBadRequest, res.Status)
		tests.AssertSchema(t, res.Raw, "error.json")
		require.Contains(t, tests.Message(t, res.Map(t)), "password")
	})
}

func TestRegisterRejectsShortUsername(t *testing.T) {
	wrapAuth(t, "POST /api/auth/register rejects a short username with 400", func(a *allure.Context) {
		res := tests.Request(t, a, http.MethodPost, "/api/auth/register", tests.RequestOpt{
			JSON: map[string]string{"username": "ab", "password": "password123"},
		})
		require.Equal(t, http.StatusBadRequest, res.Status)
		tests.AssertSchema(t, res.Raw, "error.json")
		require.Contains(t, tests.Message(t, res.Map(t)), "username")
	})
}

func TestRegisterRejectsEmptyUsername(t *testing.T) {
	wrapAuth(t, "POST /api/auth/register rejects an empty username with 400", func(a *allure.Context) {
		res := tests.Request(t, a, http.MethodPost, "/api/auth/register", tests.RequestOpt{
			JSON: map[string]string{"username": "", "password": "password123"},
		})
		require.Equal(t, http.StatusBadRequest, res.Status)
		tests.AssertSchema(t, res.Raw, "error.json")
		require.Contains(t, tests.Message(t, res.Map(t)), "username")
	})
}

func TestRegisterRejectsEmptyPassword(t *testing.T) {
	wrapAuth(t, "POST /api/auth/register rejects an empty password with 400", func(a *allure.Context) {
		res := tests.Request(t, a, http.MethodPost, "/api/auth/register", tests.RequestOpt{
			JSON: map[string]string{"username": "newuser", "password": ""},
		})
		require.Equal(t, http.StatusBadRequest, res.Status)
		tests.AssertSchema(t, res.Raw, "error.json")
		require.Contains(t, tests.Message(t, res.Map(t)), "password")
	})
}

func TestRegisterRejectsEmptyCredentials(t *testing.T) {
	wrapAuth(t, "POST /api/auth/register joins both field errors into one 400 message", func(a *allure.Context) {
		res := tests.Request(t, a, http.MethodPost, "/api/auth/register", tests.RequestOpt{
			JSON: map[string]string{"username": "", "password": ""},
		})
		require.Equal(t, http.StatusBadRequest, res.Status)
		tests.AssertSchema(t, res.Raw, "error.json")
		message := tests.Message(t, res.Map(t))
		require.Contains(t, message, "username")
		require.Contains(t, message, "password")
	})
}

func TestRegisterRejectsMalformedJSON(t *testing.T) {
	wrapAuth(t, "POST /api/auth/register answers a malformed JSON body with 400, not 401", func(a *allure.Context) {
		res := tests.Request(t, a, http.MethodPost, "/api/auth/register", tests.RequestOpt{Raw: "not json"})
		require.Equal(t, http.StatusBadRequest, res.Status)
		require.Equal(t, "Request body is not valid JSON", tests.Message(t, res.Map(t)))
	})
}

func TestProfileWithBearerToken(t *testing.T) {
	wrapAuth(t, "GET /api/auth/me returns the profile contract for a bearer token", func(a *allure.Context) {
		token := tests.Login(t, a, "user1", "password1")
		res := tests.Request(t, a, http.MethodGet, "/api/auth/me", tests.RequestOpt{Token: token})
		require.Equal(t, http.StatusOK, res.Status)
		tests.AssertSchema(t, res.Raw, "profile.json")
		require.Equal(t, "user1", res.Map(t)["username"])
	})
}

func TestProfileWithoutToken(t *testing.T) {
	wrapAuth(t, "GET /api/auth/me without a token returns 401", func(a *allure.Context) {
		res := tests.Request(t, a, http.MethodGet, "/api/auth/me", tests.RequestOpt{})
		require.Equal(t, http.StatusUnauthorized, res.Status)
	})
}

func TestProfileWithGarbageToken(t *testing.T) {
	wrapAuth(t, "GET /api/auth/me with a garbage token returns 401", func(a *allure.Context) {
		res := tests.Request(t, a, http.MethodGet, "/api/auth/me", tests.RequestOpt{Token: "not-a-jwt"})
		require.Equal(t, http.StatusUnauthorized, res.Status)
	})
}

func TestLogoutReturnsNoContent(t *testing.T) {
	wrapAuth(t, "POST /api/auth/logout returns 204", func(a *allure.Context) {
		res := tests.Request(t, a, http.MethodPost, "/api/auth/logout", tests.RequestOpt{})
		require.Equal(t, http.StatusNoContent, res.Status)
	})
}

func TestDeleteWithoutToken(t *testing.T) {
	wrapAuth(t, "DELETE /api/auth/me without a token returns 401", func(a *allure.Context) {
		res := tests.Request(t, a, http.MethodDelete, "/api/auth/me", tests.RequestOpt{})
		require.Equal(t, http.StatusUnauthorized, res.Status)
	}, allure.WithTag("negative"))
}

func TestDeleteWithGarbageToken(t *testing.T) {
	wrapAuth(t, "DELETE /api/auth/me with a garbage token returns 401", func(a *allure.Context) {
		res := tests.Request(t, a, http.MethodDelete, "/api/auth/me", tests.RequestOpt{Token: "not-a-jwt"})
		require.Equal(t, http.StatusUnauthorized, res.Status)
	}, allure.WithTag("negative"))
}

func TestDeleteRemovesAccount(t *testing.T) {
	wrapAuth(t, "DELETE /api/auth/me removes the account: repeated login is rejected", func(a *allure.Context) {
		name := tests.Username()
		token := tests.Register(t, a, name, "password123")
		tests.DeleteAccount(t, a, token)
		res := tests.Request(t, a, http.MethodPost, "/api/auth/login", tests.RequestOpt{
			JSON: map[string]string{"username": name, "password": "password123"},
		})
		require.Equal(t, http.StatusUnauthorized, res.Status)
		require.Equal(t, tests.WrongCredentialsMessage, tests.Message(t, res.Map(t)))
	})
}

func TestUnmappedAPIPathRequiresAuthentication(t *testing.T) {
	wrapAuth(t, "unmapped /api/* path requires authentication (security catch-all)", func(a *allure.Context) {
		res := tests.Request(t, a, http.MethodGet, "/api/nope", tests.RequestOpt{})
		require.Equal(t, http.StatusUnauthorized, res.Status)
	})
}
