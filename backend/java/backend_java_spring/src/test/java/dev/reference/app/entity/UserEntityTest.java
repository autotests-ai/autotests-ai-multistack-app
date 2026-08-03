package dev.reference.app.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

@DisplayName("UserEntity")
class UserEntityTest {

    @Test
    @DisplayName("constructor and getters expose user fields")
    void constructorAndGettersExposeUserFields() {
        var user = new UserEntity("user1", "hash");
        ReflectionTestUtils.setField(user, "id", 7L);

        assertEquals(7L, user.getId());
        assertEquals("user1", user.getUsername());
        assertEquals("hash", user.getPasswordHash());
        assertNotNull(user.getCreatedAt());
    }

    @Test
    @DisplayName("protected no-args constructor initializes createdAt")
    void noArgsConstructorInitializesCreatedAt() throws Exception {
        var constructor = UserEntity.class.getDeclaredConstructor();
        constructor.setAccessible(true);

        var user = constructor.newInstance();

        assertNull(user.getId());
        assertNull(user.getUsername());
        assertNull(user.getPasswordHash());
        assertNotNull(user.getCreatedAt());
    }
}
