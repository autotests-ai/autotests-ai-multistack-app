package dev.multistack.app.service;

import com.fasterxml.jackson.databind.JsonNode;
import dev.multistack.app.dto.NoteDto;
import dev.multistack.app.dto.NotePutRequest;
import dev.multistack.app.dto.NotePutResult;
import dev.multistack.app.entity.NoteEntity;
import dev.multistack.app.entity.UserEntity;
import dev.multistack.app.exception.AuthException;
import dev.multistack.app.exception.NoteException;
import dev.multistack.app.repository.NoteRepository;
import dev.multistack.app.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NoteService {

    static final int TITLE_MAX = 120;
    static final int TEXT_MAX = 2000;

    private final UserRepository userRepository;
    private final NoteRepository noteRepository;

    public NoteService(UserRepository userRepository, NoteRepository noteRepository) {
        this.userRepository = userRepository;
        this.noteRepository = noteRepository;
    }

    @Transactional
    public NotePutResult put(String username, NotePutRequest request) {
        UserEntity user = requireUser(username);
        return noteRepository.findByUser(user)
                .map(existing -> {
                    existing.setTitle(request.title());
                    existing.setText(request.text());
                    return new NotePutResult(false, toDto(noteRepository.save(existing)));
                })
                .orElseGet(() -> new NotePutResult(
                        true,
                        toDto(noteRepository.save(new NoteEntity(user, request.title(), request.text())))));
    }

    @Transactional(readOnly = true)
    public NoteDto get(String username) {
        return toDto(requireNote(requireUser(username)));
    }

    @Transactional
    public NoteDto patch(String username, JsonNode patch) {
        NoteEntity note = requireNote(requireUser(username));
        applyMergePatch(note, patch);
        return toDto(noteRepository.save(note));
    }

    @Transactional
    public void delete(String username) {
        noteRepository.delete(requireNote(requireUser(username)));
    }

    private UserEntity requireUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AuthException(401, "Unauthorized"));
    }

    private NoteEntity requireNote(UserEntity user) {
        return noteRepository.findByUser(user)
                .orElseThrow(() -> new NoteException(404, "Note not found"));
    }

    private void applyMergePatch(NoteEntity note, JsonNode patch) {
        if (patch == null || !patch.isObject()) {
            throw new NoteException(400, "Patch body must be a JSON object");
        }
        if (patch.has("title")) {
            note.setTitle(readTitle(patch.get("title")));
        }
        if (patch.has("text")) {
            note.setText(readText(patch.get("text")));
        }
    }

    private String readTitle(JsonNode node) {
        if (node.isNull()) {
            return "";
        }
        if (!node.isTextual()) {
            throw new NoteException(400, "title must be a string");
        }
        String title = node.asText();
        if (title.length() > TITLE_MAX) {
            throw new NoteException(400, "title must be at most 120 characters");
        }
        return title;
    }

    private String readText(JsonNode node) {
        if (node.isNull()) {
            throw new NoteException(422, "text cannot be null");
        }
        if (!node.isTextual()) {
            throw new NoteException(400, "text must be a string");
        }
        String text = node.asText();
        if (text.isBlank() || text.length() > TEXT_MAX) {
            throw new NoteException(400, "text must be between 1 and 2000 characters");
        }
        return text;
    }

    private NoteDto toDto(NoteEntity note) {
        return new NoteDto(note.getId(), note.getTitle(), note.getText());
    }
}
