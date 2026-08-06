package dev.reference.app.config;

import dev.reference.app.allure.UnitTestBase;

import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

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

    @Test
    @DisplayName("allows any origin pattern on /api/**")
    void apiCorsAllowsOriginPatterns() {
        CorsConfiguration cors = new CorsConfig()
                .corsConfigurationSource()
                .getCorsConfiguration(new MockHttpServletRequest("GET", "/api/health"));

        assertNotNull(cors);
        assertEquals(List.of("*"), cors.getAllowedOriginPatterns());
        assertFalse(Boolean.TRUE.equals(cors.getAllowCredentials()));
    }
}
