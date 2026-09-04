package dev.multistack.app.config

import dev.multistack.app.controller.ApiController
import dev.multistack.app.controller.AuthController
import dev.multistack.app.controller.OpenApiController
import dev.multistack.app.dto.UserProfileResponse
import dev.multistack.app.service.AuthService
import dev.multistack.app.service.ItemService
import dev.multistack.app.service.JwtService
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.mockito.kotlin.whenever
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Import
import org.springframework.http.HttpHeaders
import org.springframework.test.context.bean.override.mockito.MockitoBean
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.header
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

/**
 * The one slice where [JwtAuthFilter] runs with a *real* [JwtService]:
 * requests carry actual `Authorization: Bearer` headers and pass (or fail) through the
 * full security chain — no `SecurityMockMvcRequestPostProcessors` shortcuts here.
 */
@WebMvcTest(controllers = [ApiController::class, AuthController::class, OpenApiController::class])
@Import(SecurityChainTest.RealJwtConfig::class, SecurityConfig::class, CorsConfig::class)
@DisplayName("Security chain with real JWT filter")
class SecurityChainTest {
    @TestConfiguration
    class RealJwtConfig {
        @Bean
        fun jwtService(): JwtService = JwtService(SECRET, ONE_HOUR_MS)
    }

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var jwtService: JwtService

    @MockitoBean
    private lateinit var itemService: ItemService

    @MockitoBean
    private lateinit var authService: AuthService

    @Test
    @DisplayName("GET /api/auth/me with a real bearer token passes the filter chain")
    fun meWithRealBearerToken() {
        whenever(authService.profile("user1")).thenReturn(UserProfileResponse("user1"))
        val token = jwtService.createToken("user1")

        mockMvc.perform(
            get("/api/auth/me").header(HttpHeaders.AUTHORIZATION, "Bearer $token"),
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.username").value("user1"))
    }

    @Test
    @DisplayName("GET /api/auth/me with a tampered token returns 401")
    fun meWithTamperedToken() {
        val tampered = jwtService.createToken("user1") + "xx"

        mockMvc.perform(
            get("/api/auth/me").header(HttpHeaders.AUTHORIZATION, "Bearer $tampered"),
        )
            .andExpect(status().isUnauthorized)
    }

    @Test
    @DisplayName("GET /api/auth/me with an expired token returns 401")
    fun meWithExpiredToken() {
        val expired = JwtService(SECRET, -ONE_HOUR_MS).createToken("user1")

        mockMvc.perform(
            get("/api/auth/me").header(HttpHeaders.AUTHORIZATION, "Bearer $expired"),
        )
            .andExpect(status().isUnauthorized)
    }

    @Test
    @DisplayName("GET /api/openapi.yaml is public")
    fun openapiYamlPermitAll() {
        mockMvc.perform(get("/api/openapi.yaml")).andExpect(status().isOk)
    }

    @Test
    @DisplayName("GET /api/docs is public")
    fun openapiDocsPermitAll() {
        mockMvc.perform(get("/api/docs")).andExpect(status().isOk)
    }

    @Test
    @DisplayName("unmapped /api/** path requires authentication (catch-all)")
    fun unmappedApiPathRequiresAuthentication() {
        mockMvc.perform(get("/api/nope")).andExpect(status().isUnauthorized)
    }

    @Test
    @DisplayName("unmapped /api/** path with a valid token is 404, not 401")
    fun unmappedApiPathWithTokenIsNotFound() {
        val token = jwtService.createToken("user1")

        mockMvc.perform(
            get("/api/nope").header(HttpHeaders.AUTHORIZATION, "Bearer $token"),
        )
            .andExpect(status().isNotFound)
    }

    @Test
    @DisplayName("CORS preflight for /api/items answers the configured origin")
    fun corsPreflightAllowsConfiguredOrigin() {
        mockMvc.perform(
            options("/api/items")
                .header(HttpHeaders.ORIGIN, "http://localhost:5173")
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"),
        )
            .andExpect(status().isOk)
            .andExpect(
                header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:5173"),
            )
    }

    @Test
    @DisplayName("non-API paths are denied")
    fun nonApiDenied() {
        mockMvc.perform(get("/login")).andExpect(status().isUnauthorized)
    }

    @Test
    @DisplayName("GET /actuator/prometheus on the API port is not 200")
    fun actuatorPrometheusNotOkOnApiPort() {
        val status = mockMvc.perform(get("/actuator/prometheus"))
            .andReturn()
            .response
            .status
        org.junit.jupiter.api.Assertions.assertNotEquals(200, status)
    }

    companion object {
        private const val SECRET = "security-chain-test-secret-at-least-32-chars"
        private const val ONE_HOUR_MS = 3_600_000L
    }
}
