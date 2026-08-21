package api

import (
	_ "embed"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Module copy of _contract/openapi.yaml and the Swagger UI that points at it.
// Not swag/codegen — the yaml is SSOT.
//
//go:embed openapi.yaml
var openAPISpec []byte

//go:embed openapi-docs.html
var openAPIDocs []byte

// OpenAPISpec answers GET /api/openapi.yaml with the embedded contract copy.
func (h *Handler) OpenAPISpec(c *gin.Context) {
	c.Data(http.StatusOK, "application/yaml", openAPISpec)
}

// OpenAPIDocs answers GET /api/docs with Swagger UI pointed at ./openapi.yaml.
func (h *Handler) OpenAPIDocs(c *gin.Context) {
	c.Data(http.StatusOK, "text/html; charset=utf-8", openAPIDocs)
}
