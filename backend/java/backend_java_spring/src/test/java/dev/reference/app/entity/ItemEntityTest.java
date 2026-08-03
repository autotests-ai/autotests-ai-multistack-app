package dev.reference.app.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

@DisplayName("ItemEntity")
class ItemEntityTest {

    @Test
    @DisplayName("constructor and getters expose item fields")
    void constructorAndGettersExposeItemFields() {
        var item = new ItemEntity("Alpha", "First item");
        ReflectionTestUtils.setField(item, "id", 3L);

        assertEquals(3L, item.getId());
        assertEquals("Alpha", item.getName());
        assertEquals("First item", item.getDescription());
    }

    @Test
    @DisplayName("protected no-args constructor leaves fields unset")
    void noArgsConstructorLeavesFieldsUnset() throws Exception {
        var constructor = ItemEntity.class.getDeclaredConstructor();
        constructor.setAccessible(true);

        var item = constructor.newInstance();

        assertNull(item.getId());
        assertNull(item.getName());
        assertNull(item.getDescription());
    }
}
