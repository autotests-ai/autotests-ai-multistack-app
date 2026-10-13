package dev.multistack.app.db

import dev.multistack.app.dto.ItemDto
import java.sql.SQLException
import javax.sql.DataSource

data class UserRecord(
    val id: Long,
    val username: String,
    val passwordHash: String,
)

class ItemRepository(
    private val dataSource: DataSource,
) {
    fun findAll(): List<ItemDto> = dataSource.connection.use { connection ->
        connection.prepareStatement("SELECT id, name, description FROM items ORDER BY id").use { statement ->
            statement.executeQuery().use { rows ->
                buildList {
                    while (rows.next()) {
                        add(ItemDto(rows.getLong("id"), rows.getString("name"), rows.getString("description")))
                    }
                }
            }
        }
    }
}

class UserRepository(
    private val dataSource: DataSource,
) {
    fun existsByUsername(username: String): Boolean = dataSource.connection.use { connection ->
        connection.prepareStatement("SELECT 1 FROM users WHERE username = ?").use { statement ->
            statement.setString(1, username)
            statement.executeQuery().use { it.next() }
        }
    }

    fun findByUsername(username: String): UserRecord? = dataSource.connection.use { connection ->
        connection.prepareStatement("SELECT id, username, password_hash FROM users WHERE username = ?")
            .use { statement ->
                statement.setString(1, username)
                statement.executeQuery().use { rows ->
                    if (rows.next()) {
                        UserRecord(
                            rows.getLong("id"),
                            rows.getString("username"),
                            rows.getString("password_hash"),
                        )
                    } else {
                        null
                    }
                }
            }
    }

    /**
     * @return `false` on a unique-constraint violation — a concurrent insert that won the race
     * surfaces here as 409 rather than escaping as a 500 (same intent as the Spring module's
     * `saveAndFlush` inside `try/catch DataIntegrityViolationException`).
     */
    fun insert(username: String, passwordHash: String): Boolean = dataSource.connection.use { connection ->
        connection.prepareStatement("INSERT INTO users (username, password_hash) VALUES (?, ?)").use { statement ->
            statement.setString(1, username)
            statement.setString(2, passwordHash)
            try {
                statement.executeUpdate()
                true
            } catch (ex: SQLException) {
                if (ex.sqlState == SQLSTATE_UNIQUE_VIOLATION) false else throw ex
            }
        }
    }

    fun deleteById(id: Long) {
        dataSource.connection.use { connection ->
            connection.prepareStatement("DELETE FROM users WHERE id = ?").use { statement ->
                statement.setLong(1, id)
                statement.executeUpdate()
            }
        }
    }

    companion object {
        private const val SQLSTATE_UNIQUE_VIOLATION = "23505"
    }
}
