package api

import "github.com/gin-gonic/gin"

// NewRouter mounts the API-only contract: no UI routes, the frontends are separate
// nginx containers.
func NewRouter(h *Handler) *gin.Engine {
	gin.SetMode(gin.ReleaseMode)

	engine := gin.New()
	engine.Use(gin.Logger(), gin.Recovery(), CORS())

	// NoMethod stays dormant until gin is told to tell 405 apart from 404.
	engine.HandleMethodNotAllowed = true
	engine.NoRoute(h.APIFallback)
	engine.NoMethod(h.APIFallback)

	api := engine.Group(apiPrefix)
	api.GET("/health", h.Health)
	api.GET("/items", h.Items)

	auth := api.Group("/auth")
	auth.POST("/register", h.Register)
	auth.POST("/login", h.Login)
	auth.POST("/logout", h.Logout)
	auth.GET("/me", h.RequireAuth(), h.Me)
	auth.DELETE("/me", h.RequireAuth(), h.DeleteAccount)

	return engine
}
