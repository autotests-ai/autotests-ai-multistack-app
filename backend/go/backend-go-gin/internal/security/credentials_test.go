package security_test

import (
	"encoding/json"
	"strings"
	"testing"

	"dev.reference/backend-go-gin/internal/security"
)

func TestCredentialsValidate(t *testing.T) {
	cases := []struct {
		name     string
		body     string
		username string
		password string
		message  string
	}{
		{name: "valid", body: `{"username":"user1","password":"password1"}`, username: "user1", password: "password1"},
		{name: "empty body", body: `{}`, message: security.MessageUsernameRequired},
		{name: "malformed json", body: `not json`, message: security.MessageUsernameRequired},
		{name: "null username", body: `{"username":null,"password":"password1"}`, message: security.MessageUsernameRequired},
		{name: "numeric username", body: `{"username":42,"password":"password1"}`, message: security.MessageUsernameRequired},
		{name: "blank username", body: `{"username":"","password":"password1"}`, message: security.MessageUsernameRequired},
		{name: "missing password", body: `{"username":"user1"}`, message: security.MessagePasswordRequired},
		{name: "numeric password", body: `{"username":"user1","password":123456}`, message: security.MessagePasswordRequired},
		{name: "blank password", body: `{"username":"user1","password":""}`, message: security.MessagePasswordRequired},
		{name: "username too short", body: `{"username":"ab","password":"password1"}`, message: security.MessageUsernameLength},
		{name: "password too short", body: `{"username":"user1","password":"pass"}`, message: security.MessagePasswordLength},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			var creds security.Credentials
			_ = json.Unmarshal([]byte(tc.body), &creds)

			username, password, message := creds.Validate()
			if message != tc.message {
				t.Fatalf("message = %q, want %q", message, tc.message)
			}
			if username != tc.username || password != tc.password {
				t.Fatalf("credentials = (%q, %q), want (%q, %q)", username, password, tc.username, tc.password)
			}
		})
	}
}

func TestCredentialsValidateBoundaries(t *testing.T) {
	cases := []struct {
		name     string
		username string
		password string
		message  string
	}{
		{name: "shortest allowed", username: strings.Repeat("u", 3), password: strings.Repeat("p", 6)},
		{name: "longest allowed", username: strings.Repeat("u", 64), password: strings.Repeat("p", 128)},
		{name: "username one over", username: strings.Repeat("u", 65), password: "password1", message: security.MessageUsernameLength},
		{name: "password one over", username: "user1", password: strings.Repeat("p", 129), message: security.MessagePasswordLength},
		// Length is counted in runes, exactly like Python's len() on str.
		{name: "multibyte username counts runes", username: "ФИО", password: "password1"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			creds := security.Credentials{Username: tc.username, Password: tc.password}
			_, _, message := creds.Validate()
			if message != tc.message {
				t.Fatalf("message = %q, want %q", message, tc.message)
			}
		})
	}
}
