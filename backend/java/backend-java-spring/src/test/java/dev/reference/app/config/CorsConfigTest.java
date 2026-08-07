package dev.reference.app.config;

import dev.reference.app.allure.UnitTestBase;

import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;

@Epic("Security")
@Feature("CORS")
@Severity(SeverityLevel.NORMAL)
@DisplayName("CorsConfig")
class CorsConfigTest extends UnitTestBase {

    private static final List<String> DEV_ORIGINS =
            List.of("http://localhost:[*]", "http://127.0.0.1:[*]");

    @Test
    @DisplayName("applies the configured origin patterns on /api/**")
    void apiCorsAllowsOriginPatterns() {
        CorsConfiguration cors = new CorsConfig(DEV_ORIGINS)
                .corsConfigurationSource()
                .getCorsConfiguration(new MockHttpServletRequest("GET", "/api/health"));

        assertNotNull(cors);
        assertEquals(DEV_ORIGINS, cors.getAllowedOriginPatterns());
        assertFalse(Boolean.TRUE.equals(cors.getAllowCredentials()));
    }

    @Test
    @DisplayName("admits a configured dev server origin and rejects an unknown one")
    void apiCorsChecksOrigin() {
        CorsConfiguration cors = new CorsConfig(DEV_ORIGINS)
                .corsConfigurationSource()
                .getCorsConfiguration(new MockHttpServletRequest("GET", "/api/health"));

        assertNotNull(cors);
        assertEquals("http://localhost:5173", cors.checkOrigin("http://localhost:5173"));
        assertNull(cors.checkOrigin("https://evil.example.com"));
    }
}
