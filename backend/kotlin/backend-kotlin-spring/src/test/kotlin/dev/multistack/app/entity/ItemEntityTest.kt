package dev.multistack.app.entity

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test

@DisplayName("ItemEntity")
class ItemEntityTest {
    @Test
    @DisplayName("constructor and getters expose item fields")
    fun constructorAndGettersExposeItemFields() {
        val item = ItemEntity(id = 3L, name = "Alpha", description = "First item")

        assertEquals(3L, item.id)
        assertEquals("Alpha", item.name)
        assertEquals("First item", item.description)
    }

    @Test
    @DisplayName("no-args constructor uses empty defaults")
    fun noArgsConstructorUsesEmptyDefaults() {
        val item = ItemEntity()

        assertNull(item.id)
        assertTrue(item.name.isEmpty())
        assertTrue(item.description.isEmpty())
    }
}
