// Package api implements the reference HTTP contract on top of Gin.
package api

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"dev.reference/backend-go-gin/internal/config"
	"dev.reference/backend-go-gin/internal/security"
	"dev.reference/backend-go-gin/internal/store"
)

// Error messages are part of the contract — do not reword.
const (
	messageBadCredentials = "Wrong login or password"
	messageUnauthorized   = "Unauthorized"
	messageDuplicateUser  = "Username already taken"
	messageInvalidJSON    = "Request body is not valid JSON"
	messageServerError    = "Internal server error"

	itemsSource        = "postgresql"
	bearerPrefix       = "Bearer "
	authHeader         = "Authorization"
	contextUsernameKey = "username"
)

// Handler serves /api/**. It only knows the Store interface, never the driver.
type Handler struct {
	store       store.Store
	tokens      *security.TokenService
	serviceName string
}

// NewHandler wires the dependencies of the API layer.
func NewHandler(s store.Store, tokens *security.TokenService, serviceName string) *Handler {
	return &Handler{store: s, tokens: tokens, serviceName: serviceName}
}

// Health answers the liveness probe used by Docker and deploy/matrix.yaml.
func (h *Handler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, healthResponse{Status: "ok", Service: h.serviceName})
}

// Items returns every seeded item ordered by id.
func (h *Handler) Items(c *gin.Context) {
	rows, err := h.store.ListItems(c.Request.Context())
	if err != nil {
		h.serverError(c, err)
		return
	}
	items := make([]itemDTO, 0, len(rows))
	for _, row := range rows {
		items = append(items, itemDTO{ID: row.ID, Name: row.Name, Description: row.Description})
	}
	c.JSON(http.StatusOK, itemsResponse{Items: items, Source: itemsSource})
}

// Register creates a user, answering 409 both on the pre-check and on a lost unique race.
func (h *Handler) Register(c *gin.Context) {
	username, password, ok := credentials(c)
	if !ok {
		return
	}

	switch _, err := h.store.FindUserByUsername(c.Request.Context(), username); {
	case err == nil:
		c.JSON(http.StatusConflict, errorResponse{Message: messageDuplicateUser})
		return
	case !errors.Is(err, store.ErrUserNotFound):
		h.serverError(c, err)
		return
	}

	passwordHash, err := security.HashPassword(password)
	if err != nil {
		h.serverError(c, err)
		return
	}

	if _, err := h.store.CreateUser(c.Request.Context(), username, passwordHash); err != nil {
		if errors.Is(err, store.ErrDuplicateUsername) {
			c.JSON(http.StatusConflict, errorResponse{Message: messageDuplicateUser})
			return
		}
		h.serverError(c, err)
		return
	}

	h.issueToken(c, http.StatusCreated, username)
}

// Login exchanges credentials for a token; unknown user and wrong password are
// deliberately indistinguishable.
func (h *Handler) Login(c *gin.Context) {
	username, password, ok := credentials(c)
	if !ok {
		return
	}

	user, err := h.store.FindUserByUsername(c.Request.Context(), username)
	if errors.Is(err, store.ErrUserNotFound) {
		c.JSON(http.StatusUnauthorized, errorResponse{Message: messageBadCredentials})
		return
	}
	if err != nil {
		h.serverError(c, err)
		return
	}
	if !security.CheckPassword(password, user.PasswordHash) {
		c.JSON(http.StatusUnauthorized, errorResponse{Message: messageBadCredentials})
		return
	}

	h.issueToken(c, http.StatusOK, user.Username)
}

// Logout is stateless: the client simply drops the token.
func (h *Handler) Logout(c *gin.Context) {
	c.Status(http.StatusNoContent)
}

// Me echoes the authenticated username; the RequireAuth middleware already verified it.
func (h *Handler) Me(c *gin.Context) {
	username, _ := c.Get(contextUsernameKey)
	name, _ := username.(string)
	c.JSON(http.StatusOK, profileResponse{Username: name})
}

// DeleteAccount is the authenticated self-delete. Tokens are stateless, so a JWT issued
// earlier keeps verifying after deletion — but RequireAuth answers 401 once the row is gone.
func (h *Handler) DeleteAccount(c *gin.Context) {
	username, _ := c.Get(contextUsernameKey)
	name, _ := username.(string)
	if err := h.store.DeleteUser(c.Request.Context(), name); err != nil {
		h.serverError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

// APIFallback answers an unmapped path or method under /api/ with 401 instead of 404: the
// reference authenticates the whole prefix before routing, so a request never reveals
// which routes exist. Paths outside /api/ write nothing and keep gin's own 404/405 body.
func (h *Handler) APIFallback(c *gin.Context) {
	if strings.HasPrefix(c.Request.URL.Path, apiPrefix) {
		unauthorized(c)
	}
}

// RequireAuth rejects anything without a valid Bearer token for an existing user.
func (h *Handler) RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader(authHeader)
		if !strings.HasPrefix(header, bearerPrefix) {
			unauthorized(c)
			return
		}
		username, err := h.tokens.Username(strings.TrimPrefix(header, bearerPrefix))
		if err != nil {
			unauthorized(c)
			return
		}
		// A token can outlive its user; treat that as unauthenticated rather than 500.
		switch _, err := h.store.FindUserByUsername(c.Request.Context(), username); {
		case errors.Is(err, store.ErrUserNotFound):
			unauthorized(c)
			return
		case err != nil:
			h.serverError(c, err)
			return
		}
		c.Set(contextUsernameKey, username)
		c.Next()
	}
}

func (h *Handler) issueToken(c *gin.Context, status int, username string) {
	token, err := h.tokens.Create(username)
	if err != nil {
		h.serverError(c, err)
		return
	}
	c.JSON(status, authResponse{
		Token:       token,
		Username:    username,
		RedirectURL: config.PostAuthRedirect,
	})
}

func (h *Handler) serverError(c *gin.Context, err error) {
	log.Printf("%s: %v", h.serviceName, err)
	c.AbortWithStatusJSON(http.StatusInternalServerError, errorResponse{Message: messageServerError})
}

func unauthorized(c *gin.Context) {
	c.AbortWithStatusJSON(http.StatusUnauthorized, errorResponse{Message: messageUnauthorized})
}

// credentials decodes and validates the body, writing 400 itself when it is not usable.
// Anything but a JSON object — empty, malformed, an array, a scalar — is messageInvalidJSON,
// so the decode target is a pointer: a literal `null` leaves it nil instead of passing for
// an empty object, which must still go through validation.
func credentials(c *gin.Context) (username, password string, ok bool) {
	var body *security.Credentials
	if err := json.NewDecoder(c.Request.Body).Decode(&body); err != nil || body == nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, errorResponse{Message: messageInvalidJSON})
		return "", "", false
	}

	username, password, message := body.Validate()
	if message != "" {
		c.AbortWithStatusJSON(http.StatusBadRequest, errorResponse{Message: message})
		return "", "", false
	}
	return username, password, true
}
