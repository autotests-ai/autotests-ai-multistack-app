package dev.multistack.app.config

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test

@DisplayName("AppConfig")
class AppConfigTest {

    @Test
    @DisplayName("fromEnv applies the same defaults as the Spring modules' application.yml")
    fun defaults() {
        val config = AppConfig.fromEnv(emptyMap())

        assertEquals(8080, config.serverPort)
        assertEquals(8081, config.managementPort)
        assertEquals("jdbc:postgresql://localhost:5432/multistack_app_kotlin_ktor", config.jdbcUrl)
        assertEquals("multistack", config.dbUser)
        assertEquals("multistack", config.dbPassword)
        assertEquals("multistack-dev-secret-change-in-production-min-32-chars", config.jwtSecret)
        assertEquals(86_400_000L, config.jwtExpirationMs)
    }

    @Test
    @DisplayName("fromEnv() with no argument reads the process environment")
    fun processEnvironment() {
        val config = AppConfig.fromEnv()

        org.junit.jupiter.api.Assertions.assertTrue(config.serverPort > 0)
    }

    @Test
    @DisplayName("fromEnv reads DB_*/SERVER_*/JWT_* overrides")
    fun overrides() {
        val config = AppConfig.fromEnv(
            mapOf(
                "DB_HOST" to "postgres",
                "DB_PORT" to "5433",
                "DB_NAME" to "custom_db",
                "DB_USER" to "u",
                "DB_PASSWORD" to "p",
                "SERVER_PORT" to "9090",
                "MANAGEMENT_PORT" to "9091",
                "JWT_SECRET" to "s",
                "JWT_EXPIRATION_MS" to "1000",
            ),
        )

        assertEquals(9090, config.serverPort)
        assertEquals(9091, config.managementPort)
        assertEquals("jdbc:postgresql://postgres:5433/custom_db", config.jdbcUrl)
        assertEquals("u", config.dbUser)
        assertEquals("p", config.dbPassword)
        assertEquals("s", config.jwtSecret)
        assertEquals(1_000L, config.jwtExpirationMs)
    }
}
