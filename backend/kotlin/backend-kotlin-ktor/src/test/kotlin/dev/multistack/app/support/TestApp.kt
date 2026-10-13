package dev.multistack.app.support

import dev.multistack.app.AppDependencies
import dev.multistack.app.config.AppConfig
import dev.multistack.app.db.Database
import java.util.UUID

/**
 * H2 in PostgreSQL mode stands in for Postgres in unit tests — the shared `schema.sql`
 * runs unmodified on it, so repositories/migrations are covered without Docker.
 * Each call gets a private database (unique name) so suites stay isolated.
 */
object TestApp {
    fun freshDependencies(): AppDependencies {
        val config = AppConfig(
            serverPort = 0,
            managementPort = 0,
            jdbcUrl = "jdbc:h2:mem:ktor_${UUID.randomUUID().toString().replace("-", "")}" +
                ";MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE",
            dbUser = "sa",
            dbPassword = "",
            jwtSecret = "test-secret-test-secret-test-secret-32",
            jwtExpirationMs = 3_600_000L,
        )
        val dataSource = Database.createDataSource(config)
        Database.migrate(dataSource)
        return AppDependencies(dataSource, config).also { it.userSeeder.seed() }
    }
}
