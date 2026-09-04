// Package observability serves Spring-style management endpoints on a port
// separate from the JSON API, and records HTTP timings for Prometheus.
package observability

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

var httpServerRequests = prometheus.NewHistogramVec(
	prometheus.HistogramOpts{
		Name: "http_server_requests_seconds",
		Help: "HTTP request duration in seconds.",
	},
	[]string{"method", "uri", "status"},
)

func init() {
	prometheus.MustRegister(httpServerRequests)
}

// Observe records one finished request on the default registerer.
func Observe(method, uri, status string, seconds float64) {
	httpServerRequests.WithLabelValues(method, uri, status).Observe(seconds)
}

// Middleware records http_server_requests_seconds for every request on the API engine.
func Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		started := time.Now()
		c.Next()
		Observe(
			c.Request.Method,
			c.Request.URL.Path,
			strconv.Itoa(c.Writer.Status()),
			time.Since(started).Seconds(),
		)
	}
}

// NewMux is the management-port handler: health and prometheus only.
func NewMux() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /actuator/health", health)
	mux.Handle("GET /actuator/prometheus", promhttp.Handler())
	return mux
}

func health(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(`{"status":"UP"}`))
}
