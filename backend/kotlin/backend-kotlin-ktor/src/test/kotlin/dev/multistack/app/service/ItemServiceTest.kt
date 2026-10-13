package dev.multistack.app.service

import dev.multistack.app.db.ItemRepository
import dev.multistack.app.dto.ItemDto
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever

@DisplayName("ItemService")
class ItemServiceTest {

    private val repository = mock<ItemRepository>()

    private lateinit var service: ItemService

    @BeforeEach
    fun setUp() {
        service = ItemService(repository)
    }

    @Test
    @DisplayName("health returns ok status with the module service name")
    fun healthReturnsOk() {
        val response = service.health()

        assertEquals("ok", response.status)
        assertEquals("backend-kotlin-ktor", response.service)
    }

    @Test
    @DisplayName("listItems returns repository rows with postgresql source")
    fun listItemsMapsRows() {
        whenever(repository.findAll()).thenReturn(
            listOf(ItemDto(1L, "Alpha", "First item")),
        )

        val response = service.listItems()

        assertEquals(1, response.items.size)
        assertEquals("Alpha", response.items.first().name)
        assertEquals("First item", response.items.first().description)
        assertEquals("postgresql", response.source)
    }
}
