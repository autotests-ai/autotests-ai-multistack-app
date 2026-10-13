package dev.multistack.app.db

import dev.multistack.app.support.TestApp
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import java.sql.SQLException
import javax.sql.DataSource

@DisplayName("Database + repositories on H2 (PostgreSQL mode)")
class DatabaseTest {

    @Test
    @DisplayName("migrate creates the schema and seeds the three contract items")
    fun migrateSeedsItems() {
        val deps = TestApp.freshDependencies()

        val items = deps.itemRepository.findAll()

        assertEquals(3, items.size)
        assertEquals(listOf("Alpha", "Beta", "Gamma"), items.map { it.name })
    }

    @Test
    @DisplayName("migrate is idempotent — re-running keeps one item set")
    fun migrateIsIdempotent() {
        val deps = TestApp.freshDependencies()

        // schema.sql is guarded by IF NOT EXISTS / WHERE NOT EXISTS — no duplicate rows
        Database.migrate(deps.dataSource)

        assertEquals(3, deps.itemRepository.findAll().size)
    }

    @Test
    @DisplayName("seed inserts user1 with a verifiable bcrypt hash")
    fun seedCreatesUser1() {
        val deps = TestApp.freshDependencies()

        val user = deps.userRepository.findByUsername("user1")

        assertEquals("user1", user?.username)
        assertTrue(deps.passwordHasher.matches("password1", user!!.passwordHash))
    }

    @Test
    @DisplayName("UserRepository: insert → exists/find → duplicate → false → delete")
    fun userRepositoryCrud() {
        val repo = TestApp.freshDependencies().userRepository

        assertTrue(repo.insert("newbie", "hash"))
        assertTrue(repo.existsByUsername("newbie"))
        assertEquals("hash", repo.findByUsername("newbie")?.passwordHash)

        assertTrue(repo.insert("dupe", "h1"))
        assertFalse(repo.insert("dupe", "h2"))

        val id = repo.findByUsername("dupe")!!.id
        repo.deleteById(id)
        assertFalse(repo.existsByUsername("dupe"))
        assertNull(repo.findByUsername("dupe"))
    }

    @Test
    @DisplayName("insert rethrows non-unique SQL errors instead of masking them as 409")
    fun insertRethrowsOtherSqlErrors() {
        val statement = mock<java.sql.PreparedStatement>()
        whenever(statement.executeUpdate()).thenThrow(SQLException("disk full", "XX000"))
        val connection = mock<java.sql.Connection>()
        whenever(connection.prepareStatement(any())).thenReturn(statement)
        val broken = mock<DataSource>()
        whenever(broken.connection).thenReturn(connection)
        val repo = UserRepository(broken)

        assertThrows(SQLException::class.java) {
            repo.insert("x", "y")
        }
    }
}
