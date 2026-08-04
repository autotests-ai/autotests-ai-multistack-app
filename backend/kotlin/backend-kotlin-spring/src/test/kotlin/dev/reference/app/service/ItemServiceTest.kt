package dev.reference.app.service

import dev.reference.app.entity.ItemEntity
import dev.reference.app.repository.ItemRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.Mockito.verify
import org.mockito.Mockito.`when`
import org.mockito.junit.jupiter.MockitoExtension
@ExtendWith(MockitoExtension::class)
@DisplayName("ItemService")
class ItemServiceTest {
    @Mock
    private lateinit var repository: ItemRepository

    private lateinit var service: ItemService

    @BeforeEach
    fun setUp() {
        service = ItemService(repository)
    }

    @Test
    @DisplayName("health returns ok status")
    fun healthReturnsOk() {
        val response = service.health()

        assertEquals("ok", response.status)
        assertEquals("backend-kotlin-spring", response.service)
    }

    @Test
    @DisplayName("listItems maps repository rows to DTOs")
    fun listItemsMapsRows() {
        val alpha = ItemEntity(id = 1L, name = "Alpha", description = "First item")
        `when`(repository.findAll()).thenReturn(listOf(alpha))

        val response = service.listItems()

        assertEquals(1, response.items.size)
        assertEquals("Alpha", response.items.first().name)
        assertEquals("First item", response.items.first().description)
        assertEquals("postgresql", response.source)
        verify(repository).findAll()
    }

    @Test
    @DisplayName("listItems returns empty list when repository is empty")
    fun listItemsReturnsEmptyWhenNoRows() {
        `when`(repository.findAll()).thenReturn(emptyList())

        val response = service.listItems()

        assertTrue(response.items.isEmpty())
        assertEquals("postgresql", response.source)
    }
}
