package api

import (
	"github.com/gin-gonic/gin"

	"dev.multistack/backend-go-gin/internal/observability"
)

// NewRouter mounts the API contract. Frontends stay on separate nginx containers;
// Swagger UI is under /api/docs so the gateway /api/ proxy reaches it.
func NewRouter(h *Handler) *gin.Engine {
	gin.SetMode(gin.ReleaseMode)

	engine := gin.New()
	engine.Use(observability.Middleware(), gin.Logger(), gin.Recovery(), CORS())

	// NoMethod stays dormant until gin is told to tell 405 apart from 404.
	engine.HandleMethodNotAllowed = true
	engine.NoRoute(h.APIFallback)
	engine.NoMethod(h.APIFallback)

	api := engine.Group(apiPrefix)
	api.GET("/health", h.Health)
	api.GET("/items", h.Items)
	api.GET("/openapi.yaml", h.OpenAPISpec)
	api.GET("/docs", h.OpenAPIDocs)

	auth := api.Group("/auth")
	auth.POST("/register", h.Register)
	auth.POST("/login", h.Login)
	auth.POST("/logout", h.Logout)
	auth.GET("/me", h.RequireAuth(), h.Me)
	auth.DELETE("/me", h.RequireAuth(), h.DeleteAccount)

	return engine
}
