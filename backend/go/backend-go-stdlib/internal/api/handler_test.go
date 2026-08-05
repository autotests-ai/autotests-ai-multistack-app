package api_test

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"dev.reference/backend-go-stdlib/internal/api"
	"dev.reference/backend-go-stdlib/internal/security"
	"dev.reference/backend-go-stdlib/internal/store"
	"dev.reference/backend-go-stdlib/internal/store/storetest"
)

const (
	testSecret   = "reference-app-dev-secret-change-in-production-min-32-chars"
	testUser     = "user1"
	testPassword = "password1"
)

type harness struct {
	router http.Handler
	store  *storetest.Fake
	tokens *security.TokenService
}

func newHarness(t *testing.T, fake *storetest.Fake) harness {
	t.Helper()
	tokens := security.NewTokenService(testSecret, time.Hour)
	return harness{
		router: api.NewRouter(api.NewHandler(fake, tokens, "backend-go-stdlib")),
		store:  fake,
		tokens: tokens,
	}
}

// seededHarness starts from a store that already holds the demo user, hashed as in production.
func seededHarness(t *testing.T) harness {
	t.Helper()
	hash, err := security.HashPassword(testPassword)
	if err != nil {
		t.Fatalf("HashPassword: %v", err)
	}
	return newHarness(t, storetest.New().WithUser(testUser, hash))
}

func (h harness) do(t *testing.T, method, path, body string, headers map[string]string) *httptest.ResponseRecorder {
	t.Helper()
	var reader *strings.Reader
	if body == "" {
		reader = strings.NewReader("")
	} else {
		reader = strings.NewReader(body)
	}
	request := httptest.NewRequest(method, path, reader)
	request.Header.Set("Content-Type", "application/json")
	for key, value := range headers {
		request.Header.Set(key, value)
	}
	recorder := httptest.NewRecorder()
	h.router.ServeHTTP(recorder, request)
	return recorder
}

func decode[T any](t *testing.T, recorder *httptest.ResponseRecorder) T {
	t.Helper()
	var payload T
	if err := json.Unmarshal(recorder.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode %q: %v", recorder.Body.String(), err)
	}
	return payload
}

func requireStatus(t *testing.T, recorder *httptest.ResponseRecorder, want int) {
	t.Helper()
	if recorder.Code != want {
		t.Fatalf("status = %d, want %d (body %q)", recorder.Code, want, recorder.Body.String())
	}
}

func requireMessage(t *testing.T, recorder *httptest.ResponseRecorder, want string) {
	t.Helper()
	payload := decode[map[string]any](t, recorder)
	if len(payload) != 1 {
		t.Fatalf("error body = %v, want only a message field", payload)
	}
	if payload["message"] != want {
		t.Fatalf("message = %v, want %q", payload["message"], want)
	}
}

func TestHealth(t *testing.T) {
	h := newHarness(t, storetest.New())

	recorder := h.do(t, http.MethodGet, "/api/health", "", nil)

	requireStatus(t, recorder, http.StatusOK)
	if body := recorder.Body.String(); body != `{"status":"ok","service":"backend-go-stdlib"}` {
		t.Fatalf("body = %s", body)
	}
}

func TestItems(t *testing.T) {
	h := newHarness(t, storetest.New().
		WithItem("Alpha", "First seeded item from PostgreSQL").
		WithItem("Beta", "Second seeded item for demo API"))

	recorder := h.do(t, http.MethodGet, "/api/items", "", nil)

	requireStatus(t, recorder, http.StatusOK)
	want := `{"items":[` +
		`{"id":1,"name":"Alpha","description":"First seeded item from PostgreSQL"},` +
		`{"id":2,"name":"Beta","description":"Second seeded item for demo API"}` +
		`],"source":"postgresql"}`
	if body := recorder.Body.String(); body != want {
		t.Fatalf("body = %s\nwant  = %s", body, want)
	}
}

func TestItemsEmptyIsAnArrayNotNull(t *testing.T) {
	h := newHarness(t, storetest.New())

	recorder := h.do(t, http.MethodGet, "/api/items", "", nil)

	requireStatus(t, recorder, http.StatusOK)
	if body := recorder.Body.String(); body != `{"items":[],"source":"postgresql"}` {
		t.Fatalf("body = %s", body)
	}
}

func TestItemsDatabaseFailure(t *testing.T) {
	fake := storetest.New()
	fake.ListItemsErr = errors.New("db down")
	h := newHarness(t, fake)

	recorder := h.do(t, http.MethodGet, "/api/items", "", nil)

	requireStatus(t, recorder, http.StatusInternalServerError)
	requireMessage(t, recorder, "Internal server error")
}

func TestRegisterCreatesUser(t *testing.T) {
	h := newHarness(t, storetest.New())

	recorder := h.do(t, http.MethodPost, "/api/auth/register", `{"username":"newbie","password":"password1"}`, nil)

	requireStatus(t, recorder, http.StatusCreated)
	payload := decode[map[string]any](t, recorder)
	if payload["username"] != "newbie" || payload["redirectUrl"] != "/" {
		t.Fatalf("payload = %v", payload)
	}
	token, _ := payload["token"].(string)
	if token == "" {
		t.Fatal("token is empty")
	}
	if username, err := h.tokens.Username(token); err != nil || username != "newbie" {
		t.Fatalf("token subject = %q, err = %v", username, err)
	}

	created, err := h.store.FindUserByUsername(t.Context(), "newbie")
	if err != nil {
		t.Fatalf("user was not stored: %v", err)
	}
	if created.PasswordHash == "password1" || !security.CheckPassword("password1", created.PasswordHash) {
		t.Fatalf("password hash = %q, want a bcrypt hash of the password", created.PasswordHash)
	}
}

func TestRegisterDuplicateUsername(t *testing.T) {
	h := seededHarness(t)

	recorder := h.do(t, http.MethodPost, "/api/auth/register", `{"username":"user1","password":"password1"}`, nil)

	requireStatus(t, recorder, http.StatusConflict)
	requireMessage(t, recorder, "Username already taken")
}

func TestRegisterLostUniqueRace(t *testing.T) {
	// The pre-check passes, then a concurrent insert wins: the unique constraint must
	// still surface as 409, never as 500.
	fake := storetest.New()
	fake.CreateUserErr = store.ErrDuplicateUsername
	h := newHarness(t, fake)

	recorder := h.do(t, http.MethodPost, "/api/auth/register", `{"username":"racer","password":"password1"}`, nil)

	requireStatus(t, recorder, http.StatusConflict)
	requireMessage(t, recorder, "Username already taken")
}

func TestRegisterDatabaseFailures(t *testing.T) {
	failure := errors.New("db down")

	t.Run("lookup", func(t *testing.T) {
		fake := storetest.New()
		fake.FindUserErr = failure
		recorder := newHarness(t, fake).
			do(t, http.MethodPost, "/api/auth/register", `{"username":"newbie","password":"password1"}`, nil)

		requireStatus(t, recorder, http.StatusInternalServerError)
		requireMessage(t, recorder, "Internal server error")
	})

	t.Run("insert", func(t *testing.T) {
		fake := storetest.New()
		fake.CreateUserErr = failure
		recorder := newHarness(t, fake).
			do(t, http.MethodPost, "/api/auth/register", `{"username":"newbie","password":"password1"}`, nil)

		requireStatus(t, recorder, http.StatusInternalServerError)
		requireMessage(t, recorder, "Internal server error")
	})
}

func TestLoginSucceeds(t *testing.T) {
	h := seededHarness(t)

	recorder := h.do(t, http.MethodPost, "/api/auth/login", `{"username":"user1","password":"password1"}`, nil)

	requireStatus(t, recorder, http.StatusOK)
	payload := decode[map[string]any](t, recorder)
	if payload["username"] != testUser || payload["redirectUrl"] != "/" {
		t.Fatalf("payload = %v", payload)
	}
	if token, _ := payload["token"].(string); token == "" {
		t.Fatal("token is empty")
	}
}

func TestLoginRejectsBadCredentials(t *testing.T) {
	cases := map[string]string{
		"wrong password": `{"username":"user1","password":"wrong-password"}`,
		"unknown user":   `{"username":"ghost","password":"password1"}`,
	}

	for name, body := range cases {
		t.Run(name, func(t *testing.T) {
			recorder := seededHarness(t).do(t, http.MethodPost, "/api/auth/login", body, nil)

			requireStatus(t, recorder, http.StatusUnauthorized)
			requireMessage(t, recorder, "Wrong login or password")
		})
	}
}

func TestLoginDatabaseFailure(t *testing.T) {
	fake := storetest.New()
	fake.FindUserErr = errors.New("db down")

	recorder := newHarness(t, fake).do(t, http.MethodPost, "/api/auth/login", `{"username":"user1","password":"password1"}`, nil)

	requireStatus(t, recorder, http.StatusInternalServerError)
	requireMessage(t, recorder, "Internal server error")
}

func TestCredentialValidationIsRejectedWith400(t *testing.T) {
	cases := []struct {
		name    string
		body    string
		message string
	}{
		{name: "no body", body: "", message: "username is required"},
		{name: "empty object", body: `{}`, message: "username is required"},
		{name: "malformed json", body: `{`, message: "username is required"},
		{name: "username not a string", body: `{"username":7,"password":"password1"}`, message: "username is required"},
		{name: "missing password", body: `{"username":"user1"}`, message: "password is required"},
		{name: "username too short", body: `{"username":"ab","password":"password1"}`, message: "username must be 3-64 characters"},
		{name: "username too long", body: `{"username":"` + strings.Repeat("u", 65) + `","password":"password1"}`, message: "username must be 3-64 characters"},
		{name: "password too short", body: `{"username":"user1","password":"short"}`, message: "password must be 6-128 characters"},
		{name: "password too long", body: `{"username":"user1","password":"` + strings.Repeat("p", 129) + `"}`, message: "password must be 6-128 characters"},
	}

	for _, path := range []string{"/api/auth/register", "/api/auth/login"} {
		for _, tc := range cases {
			t.Run(path+"/"+tc.name, func(t *testing.T) {
				recorder := seededHarness(t).do(t, http.MethodPost, path, tc.body, nil)

				requireStatus(t, recorder, http.StatusBadRequest)
				requireMessage(t, recorder, tc.message)
			})
		}
	}
}

func TestLogout(t *testing.T) {
	h := seededHarness(t)

	recorder := h.do(t, http.MethodPost, "/api/auth/logout", "", nil)

	requireStatus(t, recorder, http.StatusNoContent)
	if body := recorder.Body.String(); body != "" {
		t.Fatalf("body = %q, want empty", body)
	}
}

func TestMeWithValidToken(t *testing.T) {
	h := seededHarness(t)
	token, err := h.tokens.Create(testUser)
	if err != nil {
		t.Fatalf("Create: %v", err)
	}

	recorder := h.do(t, http.MethodGet, "/api/auth/me", "", map[string]string{"Authorization": "Bearer " + token})

	requireStatus(t, recorder, http.StatusOK)
	if body := recorder.Body.String(); body != `{"username":"user1"}` {
		t.Fatalf("body = %s", body)
	}
}

func TestMeRejectsBadTokens(t *testing.T) {
	h := seededHarness(t)
	valid, err := h.tokens.Create(testUser)
	if err != nil {
		t.Fatalf("Create: %v", err)
	}
	expired, err := security.NewTokenService(testSecret, -time.Minute).Create(testUser)
	if err != nil {
		t.Fatalf("Create expired: %v", err)
	}
	foreign, err := security.NewTokenService("some-other-secret-long-enough-for-hs256", time.Hour).Create(testUser)
	if err != nil {
		t.Fatalf("Create foreign: %v", err)
	}
	ghost, err := h.tokens.Create("deleted-user")
	if err != nil {
		t.Fatalf("Create ghost: %v", err)
	}

	cases := map[string]string{
		"no header":         "",
		"wrong scheme":      "Token " + valid,
		"bearer no space":   "Bearer" + valid,
		"empty token":       "Bearer ",
		"garbage token":     "Bearer not.a.token",
		"expired token":     "Bearer " + expired,
		"foreign signature": "Bearer " + foreign,
		"deleted user":      "Bearer " + ghost,
	}

	for name, header := range cases {
		t.Run(name, func(t *testing.T) {
			headers := map[string]string{}
			if header != "" {
				headers["Authorization"] = header
			}

			recorder := h.do(t, http.MethodGet, "/api/auth/me", "", headers)

			requireStatus(t, recorder, http.StatusUnauthorized)
			requireMessage(t, recorder, "Unauthorized")
		})
	}
}

func TestMeDatabaseFailure(t *testing.T) {
	h := seededHarness(t)
	token, err := h.tokens.Create(testUser)
	if err != nil {
		t.Fatalf("Create: %v", err)
	}
	h.store.FindUserErr = errors.New("db down")

	recorder := h.do(t, http.MethodGet, "/api/auth/me", "", map[string]string{"Authorization": "Bearer " + token})

	requireStatus(t, recorder, http.StatusInternalServerError)
	requireMessage(t, recorder, "Internal server error")
}

func TestMaximumLengthPasswordRoundTrips(t *testing.T) {
	// The contract allows 128 characters, which is longer than bcrypt's 72-byte input
	// window; register and login must both work, exactly as in the other backends.
	password := strings.Repeat("x", 128)
	h := newHarness(t, storetest.New())

	registered := h.do(t, http.MethodPost, "/api/auth/register",
		`{"username":"longpass","password":"`+password+`"}`, nil)
	requireStatus(t, registered, http.StatusCreated)

	loggedIn := h.do(t, http.MethodPost, "/api/auth/login",
		`{"username":"longpass","password":"`+password+`"}`, nil)
	requireStatus(t, loggedIn, http.StatusOK)

	token, _ := decode[map[string]any](t, loggedIn)["token"].(string)
	profile := h.do(t, http.MethodGet, "/api/auth/me", "", map[string]string{"Authorization": "Bearer " + token})

	requireStatus(t, profile, http.StatusOK)
	if body := profile.Body.String(); body != `{"username":"longpass"}` {
		t.Fatalf("body = %s", body)
	}
}

func TestRegisterThenLoginThenMe(t *testing.T) {
	h := newHarness(t, storetest.New())

	registered := h.do(t, http.MethodPost, "/api/auth/register", `{"username":"fresh","password":"password1"}`, nil)
	requireStatus(t, registered, http.StatusCreated)

	loggedIn := h.do(t, http.MethodPost, "/api/auth/login", `{"username":"fresh","password":"password1"}`, nil)
	requireStatus(t, loggedIn, http.StatusOK)

	token, _ := decode[map[string]any](t, loggedIn)["token"].(string)
	profile := h.do(t, http.MethodGet, "/api/auth/me", "", map[string]string{"Authorization": "Bearer " + token})

	requireStatus(t, profile, http.StatusOK)
	if body := profile.Body.String(); body != `{"username":"fresh"}` {
		t.Fatalf("body = %s", body)
	}
}
