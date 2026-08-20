package dev.multistack.app.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.multistack.app.allure.UnitTestBase;
import dev.multistack.app.dto.NoteDto;
import dev.multistack.app.dto.NotePutRequest;
import dev.multistack.app.dto.NotePutResult;
import dev.multistack.app.entity.NoteEntity;
import dev.multistack.app.entity.UserEntity;
import dev.multistack.app.exception.AuthException;
import dev.multistack.app.exception.NoteException;
import dev.multistack.app.repository.NoteRepository;
import dev.multistack.app.repository.UserRepository;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@Epic("Note")
@Feature("NoteService")
@Severity(SeverityLevel.CRITICAL)
@ExtendWith(MockitoExtension.class)
@DisplayName("NoteService")
class NoteServiceTest extends UnitTestBase {

    private static final String USERNAME = "user1";
    private static final ObjectMapper JSON = new ObjectMapper();

    @Mock
    private UserRepository userRepository;

    @Mock
    private NoteRepository noteRepository;

    private NoteService noteService;
    private UserEntity user;

    @BeforeEach
    void setUp() {
        noteService = new NoteService(userRepository, noteRepository);
        user = new UserEntity(USERNAME, "hash");
        ReflectionTestUtils.setField(user, "id", 11L);
    }

    @Test
    @DisplayName("put creates the singleton when the user has no note")
    void putCreatesNote() {
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
        when(noteRepository.findByUser(user)).thenReturn(Optional.empty());
        when(noteRepository.save(any(NoteEntity.class))).thenAnswer(invocation -> {
            NoteEntity entity = invocation.getArgument(0);
            ReflectionTestUtils.setField(entity, "id", 42L);
            return entity;
        });

        NotePutResult result = noteService.put(USERNAME, new NotePutRequest("Title", "Body"));

        assertTrue(result.created());
        assertEquals(42L, result.note().id());
        assertEquals("Title", result.note().title());
        assertEquals("Body", result.note().text());
    }

    @Test
    @DisplayName("put replaces the existing singleton and keeps the id")
    void putReplacesNote() {
        NoteEntity existing = new NoteEntity(user, "Old", "Previous");
        ReflectionTestUtils.setField(existing, "id", 7L);
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
        when(noteRepository.findByUser(user)).thenReturn(Optional.of(existing));
        when(noteRepository.save(existing)).thenReturn(existing);

        NotePutResult result = noteService.put(USERNAME, new NotePutRequest("", "Replaced"));

        assertFalse(result.created());
        assertEquals(7L, result.note().id());
        assertEquals("", result.note().title());
        assertEquals("Replaced", result.note().text());
    }

    @Test
    @DisplayName("put rejects a username that no longer exists")
    void putUnknownUser() {
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.empty());

        AuthException ex = assertThrows(
                AuthException.class,
                () -> noteService.put(USERNAME, new NotePutRequest("T", "Body")));

        assertEquals(401, ex.getStatus());
        verify(noteRepository, never()).save(any());
    }

    @Test
    @DisplayName("get returns the singleton")
    void getReturnsNote() {
        NoteEntity existing = new NoteEntity(user, "Title", "Body");
        ReflectionTestUtils.setField(existing, "id", 3L);
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
        when(noteRepository.findByUser(user)).thenReturn(Optional.of(existing));

        NoteDto dto = noteService.get(USERNAME);

        assertEquals(3L, dto.id());
        assertEquals("Title", dto.title());
        assertEquals("Body", dto.text());
    }

    @Test
    @DisplayName("get is 404 when the singleton is missing")
    void getMissingNote() {
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
        when(noteRepository.findByUser(user)).thenReturn(Optional.empty());

        NoteException ex = assertThrows(NoteException.class, () -> noteService.get(USERNAME));

        assertEquals(404, ex.getStatus());
        assertEquals("Note not found", ex.getMessage());
    }

    @Test
    @DisplayName("get rejects a username that no longer exists")
    void getUnknownUser() {
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.empty());

        AuthException ex = assertThrows(AuthException.class, () -> noteService.get(USERNAME));

        assertEquals(401, ex.getStatus());
    }

    @Test
    @DisplayName("patch {} is a no-op")
    void patchEmptyObjectIsNoOp() throws Exception {
        NoteEntity existing = new NoteEntity(user, "Title", "Body");
        ReflectionTestUtils.setField(existing, "id", 3L);
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
        when(noteRepository.findByUser(user)).thenReturn(Optional.of(existing));
        when(noteRepository.save(existing)).thenReturn(existing);

        NoteDto dto = noteService.patch(USERNAME, tree("{}"));

        assertEquals("Title", dto.title());
        assertEquals("Body", dto.text());
    }

    @Test
    @DisplayName("patch applies a title string")
    void patchTitle() throws Exception {
        NoteEntity existing = new NoteEntity(user, "Old", "Body");
        ReflectionTestUtils.setField(existing, "id", 3L);
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
        when(noteRepository.findByUser(user)).thenReturn(Optional.of(existing));
        when(noteRepository.save(existing)).thenReturn(existing);

        NoteDto dto = noteService.patch(USERNAME, tree("{\"title\":\"New\"}"));

        assertEquals("New", dto.title());
        assertEquals("Body", dto.text());
    }

    @Test
    @DisplayName("patch JSON null on title stores empty string")
    void patchTitleNullClears() throws Exception {
        NoteEntity existing = new NoteEntity(user, "Old", "Body");
        ReflectionTestUtils.setField(existing, "id", 3L);
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
        when(noteRepository.findByUser(user)).thenReturn(Optional.of(existing));
        when(noteRepository.save(existing)).thenReturn(existing);

        NoteDto dto = noteService.patch(USERNAME, tree("{\"title\":null}"));

        assertEquals("", dto.title());
    }

    @Test
    @DisplayName("patch rejects a title longer than 120")
    void patchTitleTooLong() throws Exception {
        stubExistingNote();
        JsonNode patch = tree("{\"title\":\"" + "a".repeat(121) + "\"}");

        NoteException ex = assertThrows(NoteException.class, () -> noteService.patch(USERNAME, patch));

        assertEquals(400, ex.getStatus());
    }

    @Test
    @DisplayName("patch rejects a non-string title")
    void patchTitleNotString() throws Exception {
        stubExistingNote();
        JsonNode patch = tree("{\"title\":1}");

        NoteException ex = assertThrows(NoteException.class, () -> noteService.patch(USERNAME, patch));

        assertEquals(400, ex.getStatus());
        assertEquals("title must be a string", ex.getMessage());
    }

    @Test
    @DisplayName("patch applies a text string")
    void patchText() throws Exception {
        NoteEntity existing = new NoteEntity(user, "Title", "Old");
        ReflectionTestUtils.setField(existing, "id", 3L);
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
        when(noteRepository.findByUser(user)).thenReturn(Optional.of(existing));
        when(noteRepository.save(existing)).thenReturn(existing);

        NoteDto dto = noteService.patch(USERNAME, tree("{\"text\":\"Updated\"}"));

        assertEquals("Title", dto.title());
        assertEquals("Updated", dto.text());
    }

    @Test
    @DisplayName("patch JSON null on text is 422")
    void patchTextNullIsUnprocessable() throws Exception {
        stubExistingNote();
        JsonNode patch = tree("{\"text\":null}");

        NoteException ex = assertThrows(NoteException.class, () -> noteService.patch(USERNAME, patch));

        assertEquals(422, ex.getStatus());
        assertEquals("text cannot be null", ex.getMessage());
    }

    @Test
    @DisplayName("patch rejects blank text")
    void patchTextBlank() throws Exception {
        stubExistingNote();
        JsonNode patch = tree("{\"text\":\"   \"}");

        NoteException ex = assertThrows(NoteException.class, () -> noteService.patch(USERNAME, patch));

        assertEquals(400, ex.getStatus());
    }

    @Test
    @DisplayName("patch rejects text longer than 2000")
    void patchTextTooLong() throws Exception {
        stubExistingNote();
        JsonNode patch = tree("{\"text\":\"" + "a".repeat(2001) + "\"}");

        NoteException ex = assertThrows(NoteException.class, () -> noteService.patch(USERNAME, patch));

        assertEquals(400, ex.getStatus());
    }

    @Test
    @DisplayName("patch rejects a non-string text")
    void patchTextNotString() throws Exception {
        stubExistingNote();
        JsonNode patch = tree("{\"text\":true}");

        NoteException ex = assertThrows(NoteException.class, () -> noteService.patch(USERNAME, patch));

        assertEquals(400, ex.getStatus());
        assertEquals("text must be a string", ex.getMessage());
    }

    @Test
    @DisplayName("patch rejects a non-object body")
    void patchNonObject() throws Exception {
        stubExistingNote();
        JsonNode patch = tree("[]");

        NoteException ex = assertThrows(NoteException.class, () -> noteService.patch(USERNAME, patch));

        assertEquals(400, ex.getStatus());
        verify(noteRepository, never()).save(any());
    }

    @Test
    @DisplayName("patch rejects a null body")
    void patchNullBody() {
        stubExistingNote();

        NoteException ex = assertThrows(NoteException.class, () -> noteService.patch(USERNAME, null));

        assertEquals(400, ex.getStatus());
    }

    @Test
    @DisplayName("patch is 404 when the singleton is missing")
    void patchMissingNote() throws Exception {
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
        when(noteRepository.findByUser(user)).thenReturn(Optional.empty());
        JsonNode patch = tree("{}");

        NoteException ex = assertThrows(NoteException.class, () -> noteService.patch(USERNAME, patch));

        assertEquals(404, ex.getStatus());
    }

    @Test
    @DisplayName("patch rejects a username that no longer exists")
    void patchUnknownUser() throws Exception {
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.empty());
        JsonNode patch = tree("{}");

        AuthException ex = assertThrows(AuthException.class, () -> noteService.patch(USERNAME, patch));

        assertEquals(401, ex.getStatus());
    }

    @Test
    @DisplayName("delete removes the singleton")
    void deleteRemovesNote() {
        NoteEntity existing = new NoteEntity(user, "Title", "Body");
        ReflectionTestUtils.setField(existing, "id", 3L);
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
        when(noteRepository.findByUser(user)).thenReturn(Optional.of(existing));

        noteService.delete(USERNAME);

        verify(noteRepository).delete(existing);
    }

    @Test
    @DisplayName("delete is 404 when the singleton is missing")
    void deleteMissingNote() {
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
        when(noteRepository.findByUser(user)).thenReturn(Optional.empty());

        NoteException ex = assertThrows(NoteException.class, () -> noteService.delete(USERNAME));

        assertEquals(404, ex.getStatus());
        verify(noteRepository, never()).delete(any());
    }

    @Test
    @DisplayName("delete rejects a username that no longer exists")
    void deleteUnknownUser() {
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.empty());

        AuthException ex = assertThrows(AuthException.class, () -> noteService.delete(USERNAME));

        assertEquals(401, ex.getStatus());
    }

    private void stubExistingNote() {
        NoteEntity existing = new NoteEntity(user, "Title", "Body");
        ReflectionTestUtils.setField(existing, "id", 3L);
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
        when(noteRepository.findByUser(user)).thenReturn(Optional.of(existing));
    }

    private static JsonNode tree(String raw) throws Exception {
        return JSON.readTree(raw);
    }
}
