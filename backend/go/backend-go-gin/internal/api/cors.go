package api

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

const (
	apiPrefix      = "/api"
	allowedMethods = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
	exposedHeaders = "Authorization"
)

// CORS mirrors the reference configuration: every origin, no credentials (auth is a
// Bearer token, never an ambient cookie), Authorization exposed to the browser.
func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		if !strings.HasPrefix(c.Request.URL.Path, apiPrefix) {
			c.Next()
			return
		}
		applyCORS(c.Writer.Header(), c.Request)
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}

func applyCORS(header http.Header, r *http.Request) {
	header.Set("Access-Control-Allow-Origin", "*")
	header.Set("Access-Control-Allow-Methods", allowedMethods)
	header.Set("Access-Control-Expose-Headers", exposedHeaders)
	header.Set("Access-Control-Max-Age", "600")
	requested := r.Header.Get("Access-Control-Request-Headers")
	if requested == "" {
		requested = "*"
	}
	header.Set("Access-Control-Allow-Headers", requested)
	header.Add("Vary", "Origin")
	header.Add("Vary", "Access-Control-Request-Headers")
}
