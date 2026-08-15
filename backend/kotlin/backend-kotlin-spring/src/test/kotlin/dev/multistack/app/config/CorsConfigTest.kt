package dev.multistack.app.config

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.mock.web.MockHttpServletRequest

@DisplayName("CorsConfig")
class CorsConfigTest {
    @Test
    @DisplayName("allows any origin pattern on /api/**")
    fun apiCorsAllowsOriginPatterns() {
        val cors = CorsConfig()
            .corsConfigurationSource()
            .getCorsConfiguration(MockHttpServletRequest("GET", "/api/health"))

        assertNotNull(cors)
        assertEquals(listOf("*"), cors!!.allowedOriginPatterns)
        assertFalse(java.lang.Boolean.TRUE == cors.allowCredentials)
    }
}
