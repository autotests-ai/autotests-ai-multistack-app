package dev.reference.app.config;

import dev.reference.app.allure.Layer;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Owner;
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

@Layer("unit")
@Epic("Security")
@Feature("CORS")
@Owner("reference-app")
@Severity(SeverityLevel.NORMAL)
@DisplayName("CorsConfig")
class CorsConfigTest {

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
