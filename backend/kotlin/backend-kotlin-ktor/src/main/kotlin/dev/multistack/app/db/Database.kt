package dev.multistack.app.db

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import dev.multistack.app.config.AppConfig
import javax.sql.DataSource

/**
 * Plain-JDBC database wiring — Ktor has no Flyway/JPA analogue, so `schema.sql`
 * (idempotent DDL + seeded items) is applied on startup instead of migrations.
 */
object Database {
    fun createDataSource(config: AppConfig): HikariDataSource = HikariDataSource(
        HikariConfig().apply {
            jdbcUrl = config.jdbcUrl
            username = config.dbUser
            password = config.dbPassword
            maximumPoolSize = 5
        },
    )

    fun migrate(dataSource: DataSource) {
        val resource = Database::class.java.getResource("/schema.sql") ?: error("schema.sql not found on the classpath")
        val script = resource.readText()
        dataSource.connection.use { connection ->
            connection.createStatement().use { statement ->
                script.split(';')
                    .map { it.trim() }
                    .filter { it.isNotEmpty() }
                    .forEach { statement.execute(it) }
            }
        }
    }
}
