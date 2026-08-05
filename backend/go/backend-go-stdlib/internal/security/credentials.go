// Package security holds credential validation, password hashing and JWT handling.
package security

import "unicode/utf8"

// Credential bounds shared with every other reference backend.
const (
	UsernameMinLength = 3
	UsernameMaxLength = 64
	PasswordMinLength = 6
	PasswordMaxLength = 128
)

// Validation messages are part of the contract — do not reword.
const (
	MessageUsernameRequired = "username is required"
	MessagePasswordRequired = "password is required"
	MessageUsernameLength   = "username must be 3-64 characters"
	MessagePasswordLength   = "password must be 6-128 characters"
)

// Credentials is the raw /api/auth request body. The fields stay `any` so that a missing
// field and a field of the wrong JSON type both yield the same "is required" message as
// the Python and JVM backends.
type Credentials struct {
	Username any `json:"username"`
	Password any `json:"password"`
}

// Validate returns the trusted string values, or a non-empty message describing the first
// violation. Lengths are counted in runes, matching Python's len() on str.
func (c Credentials) Validate() (username string, password string, message string) {
	username, ok := c.Username.(string)
	if !ok || username == "" {
		return "", "", MessageUsernameRequired
	}
	password, ok = c.Password.(string)
	if !ok || password == "" {
		return "", "", MessagePasswordRequired
	}
	if n := utf8.RuneCountInString(username); n < UsernameMinLength || n > UsernameMaxLength {
		return "", "", MessageUsernameLength
	}
	if n := utf8.RuneCountInString(password); n < PasswordMinLength || n > PasswordMaxLength {
		return "", "", MessagePasswordLength
	}
	return username, password, ""
}
