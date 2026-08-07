package dev.reference.app.config;

import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Allow browser frontends on another origin (Vite / ng serve / …) to call {@code /api/**}.
 * Auth is Bearer JWT in headers — credential cookies are not required.
 *
 * <p>Deployments serve UI and API from one host through nginx, so those requests are
 * same-origin and never consult this policy; the configured patterns cover local dev
 * servers. Override {@code app.cors.allowed-origin-patterns} to admit another origin.
 */
@Configuration
public class CorsConfig {

    private final List<String> allowedOriginPatterns;

    public CorsConfig(
            @Value("${app.cors.allowed-origin-patterns}") List<String> allowedOriginPatterns
    ) {
        this.allowedOriginPatterns = List.copyOf(allowedOriginPatterns);
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(allowedOriginPatterns);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}
