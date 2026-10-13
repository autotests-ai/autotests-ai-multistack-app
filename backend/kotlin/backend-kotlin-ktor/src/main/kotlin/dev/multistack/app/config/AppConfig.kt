package dev.multistack.app.config

/** Runtime configuration — same env vars as the sibling Spring modules (`application.yml`). */
data class AppConfig(
    val serverPort: Int,
    val managementPort: Int,
    val jdbcUrl: String,
    val dbUser: String,
    val dbPassword: String,
    val jwtSecret: String,
    val jwtExpirationMs: Long,
) {
    companion object {
        const val SERVICE_NAME = "backend-kotlin-ktor"

        fun fromEnv(env: Map<String, String> = System.getenv()): AppConfig {
            val dbHost = env["DB_HOST"] ?: "localhost"
            val dbPort = env["DB_PORT"] ?: "5432"
            val dbName = env["DB_NAME"] ?: "multistack_app_kotlin_ktor"
            return AppConfig(
                serverPort = (env["SERVER_PORT"] ?: "8080").toInt(),
                managementPort = (env["MANAGEMENT_PORT"] ?: "8081").toInt(),
                jdbcUrl = "jdbc:postgresql://$dbHost:$dbPort/$dbName",
                dbUser = env["DB_USER"] ?: "multistack",
                dbPassword = env["DB_PASSWORD"] ?: "multistack",
                jwtSecret = env["JWT_SECRET"] ?: "multistack-dev-secret-change-in-production-min-32-chars",
                jwtExpirationMs = (env["JWT_EXPIRATION_MS"] ?: "86400000").toLong(),
            )
        }
    }
}
