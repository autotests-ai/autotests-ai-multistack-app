package dev.multistack.app.repository;

import dev.multistack.app.entity.NoteEntity;
import dev.multistack.app.entity.UserEntity;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Epic("Persistence")
@Feature("Note repository")
@Severity(SeverityLevel.CRITICAL)
@DisplayName("NoteRepository on real PostgreSQL")
class NoteRepositoryTest extends PostgresSliceTestBase {

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    @DisplayName("findByUser returns the saved singleton with generated id")
    void findByUserReturnsSavedNote() {
        UserEntity user = userRepository.saveAndFlush(new UserEntity("note-alice", "hash"));
        NoteEntity saved = noteRepository.saveAndFlush(new NoteEntity(user, "Title", "Body"));

        var found = noteRepository.findByUser(user);

        assertTrue(found.isPresent());
        assertEquals(saved.getId(), found.get().getId());
        assertEquals("Title", found.get().getTitle());
        assertEquals("Body", found.get().getText());
    }

    @Test
    @DisplayName("updating title and text persists through setters")
    void settersPersist() {
        UserEntity user = userRepository.saveAndFlush(new UserEntity("note-bob", "hash"));
        NoteEntity note = noteRepository.saveAndFlush(new NoteEntity(user, "Old", "Previous"));

        note.setTitle("");
        note.setText("Replaced");
        noteRepository.saveAndFlush(note);
        entityManager.clear();

        NoteEntity reloaded = noteRepository.findByUser(user).orElseThrow();
        assertEquals("", reloaded.getTitle());
        assertEquals("Replaced", reloaded.getText());
    }

    @Test
    @DisplayName("a second note for the same user violates unique user_id")
    void duplicateUserViolatesUniqueConstraint() {
        UserEntity user = userRepository.saveAndFlush(new UserEntity("note-carol", "hash"));
        noteRepository.saveAndFlush(new NoteEntity(user, "One", "First"));

        assertThrows(
                DataIntegrityViolationException.class,
                () -> noteRepository.saveAndFlush(new NoteEntity(user, "Two", "Second")));
    }

    @Test
    @DisplayName("deleting the user cascades the note (V3 ON DELETE CASCADE)")
    void deletingUserCascadesNote() {
        UserEntity user = userRepository.saveAndFlush(new UserEntity("note-dave", "hash"));
        NoteEntity note = noteRepository.saveAndFlush(new NoteEntity(user, "Title", "Body"));
        Long noteId = note.getId();
        Long userId = user.getId();
        entityManager.flush();
        entityManager.clear();

        userRepository.deleteById(userId);
        userRepository.flush();
        entityManager.clear();

        assertTrue(noteRepository.findById(noteId).isEmpty());
    }
}
