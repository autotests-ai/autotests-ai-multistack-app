package dev.multistack.app.config

import jakarta.servlet.http.HttpServletResponse
import org.springframework.boot.actuate.autoconfigure.security.servlet.EndpointRequest
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.annotation.Order
import org.springframework.http.HttpMethod
import org.springframework.security.config.Customizer
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter

@Configuration
@EnableWebSecurity
class SecurityConfig(
    private val jwtAuthFilter: JwtAuthFilter,
) {
    /**
     * Management port reuses this FilterChainProxy (Boot copies `springSecurityFilterChain`
     * into the child context). [EndpointRequest] resolves mappings from the request's
     * servlet context: actuator paths match on :8081 and miss on API :8080, so denyAll below
     * stays intact. CSRF is off: scrape is GET, no cookie session — same as the API chain.
     */
    @Bean
    @Order(0)
    @Suppress("kotlin:S4502")
    fun managementSecurityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .securityMatcher(EndpointRequest.toAnyEndpoint())
            .authorizeHttpRequests { auth ->
                auth
                    .requestMatchers(EndpointRequest.to("health", "prometheus")).permitAll()
                    .anyRequest().denyAll()
            }
            .csrf { it.disable() }
        return http.build()
    }

    /**
     * CSRF is disabled on purpose: auth is Bearer JWT ([JwtAuthFilter]) with
     * [SessionCreationPolicy.STATELESS] — no ambient cookie credential for CSRF to exploit.
     * Enabling CSRF would break JSON API clients that do not echo an XSRF token.
     *
     * This module is API-only. UI is served by per-frontend nginx containers
     * (host nginx path-routes `/{backend}/{frontend}/`).
     */
    @Bean
    @Order(1)
    @Suppress("kotlin:S4502")
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .csrf { it.disable() }
            .cors(Customizer.withDefaults())
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .authorizeHttpRequests { auth ->
                auth
                    .requestMatchers(
                        HttpMethod.GET,
                        "/api/health",
                        "/api/items",
                        "/api/openapi.yaml",
                        "/api/docs",
                    ).permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/register").permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/auth/logout").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/auth/me").authenticated()
                    .requestMatchers(HttpMethod.DELETE, "/api/auth/me").authenticated()
                    .requestMatchers("/api/**").authenticated()
                    .anyRequest().denyAll()
            }
            .exceptionHandling { ex ->
                ex.authenticationEntryPoint { _, response, _ ->
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED)
                }
            }
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter::class.java)

        return http.build()
    }

    @Bean
    fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()
}
