package dev.multistack.app.controller;

import dev.multistack.app.allure.SliceTestBase;
import dev.multistack.app.config.CorsConfig;
import dev.multistack.app.config.SecurityConfig;
import dev.multistack.app.dto.NoteDto;
import dev.multistack.app.dto.NotePutRequest;
import dev.multistack.app.dto.NotePutResult;
import dev.multistack.app.exception.AuthException;
import dev.multistack.app.exception.NoteException;
import dev.multistack.app.service.JwtService;
import dev.multistack.app.service.NoteService;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.List;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Epic("Note")
@Feature("NoteController")
@Severity(SeverityLevel.CRITICAL)
@WebMvcTest(controllers = NoteController.class)
@Import({NoteExceptionHandler.class, AuthExceptionHandler.class, SecurityConfig.class, CorsConfig.class})
@DisplayName("NoteController")
class NoteControllerTest extends SliceTestBase {

    private static final MediaType MERGE_PATCH = MediaType.parseMediaType(NoteController.MERGE_PATCH);

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private NoteService noteService;

    @MockitoBean
    private JwtService jwtService;

    @Test
    @DisplayName("PUT /api/note creates with 201 and Content-Location")
    void putCreates() throws Exception {
        when(noteService.put(eq("user1"), any(NotePutRequest.class)))
                .thenReturn(new NotePutResult(true, new NoteDto(1L, "Title", "Body")));

        mockMvc.perform(put("/api/note")
                        .with(userAuth())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Title\",\"text\":\"Body\"}"))
                .andExpect(status().isCreated())
                .andExpect(header().string(HttpHeaders.CONTENT_LOCATION, "/api/note"))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("Title"))
                .andExpect(jsonPath("$.text").value("Body"));
    }

    @Test
    @DisplayName("PUT /api/note replaces with 200")
    void putReplaces() throws Exception {
        when(noteService.put(eq("user1"), any(NotePutRequest.class)))
                .thenReturn(new NotePutResult(false, new NoteDto(1L, "", "Replaced")));

        mockMvc.perform(put("/api/note")
                        .with(userAuth())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"\",\"text\":\"Replaced\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.text").value("Replaced"));
    }

    @Test
    @DisplayName("PUT /api/note without token returns 401")
    void putRequiresAuthentication() throws Exception {
        mockMvc.perform(put("/api/note")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Title\",\"text\":\"Body\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("PUT /api/note rejects missing text with 400")
    void putRejectsBlankText() throws Exception {
        mockMvc.perform(put("/api/note")
                        .with(userAuth())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Title\",\"text\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("text")));
    }

    @Test
    @DisplayName("PUT /api/note rejects unreadable JSON with 400")
    void putRejectsUnreadableBody() throws Exception {
        mockMvc.perform(put("/api/note")
                        .with(userAuth())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("not json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Request body is not valid JSON"));
    }

    @Test
    @DisplayName("PUT /api/note with a non-JSON type returns 415")
    void putWrongMediaType() throws Exception {
        mockMvc.perform(put("/api/note")
                        .with(userAuth())
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("Title"))
                .andExpect(status().isUnsupportedMediaType());
    }

    @Test
    @DisplayName("GET /api/note returns the singleton")
    void getReturnsNote() throws Exception {
        when(noteService.get("user1")).thenReturn(new NoteDto(1L, "Title", "Body"));

        mockMvc.perform(get("/api/note").with(userAuth()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("Title"))
                .andExpect(jsonPath("$.text").value("Body"));
    }

    @Test
    @DisplayName("GET /api/note maps a missing note to 404")
    void getMissingNote() throws Exception {
        when(noteService.get("user1")).thenThrow(new NoteException(404, "Note not found"));

        mockMvc.perform(get("/api/note").with(userAuth()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Note not found"));
    }

    @Test
    @DisplayName("GET /api/note without token returns 401")
    void getRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/note"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/note maps a missing user to 401")
    void getUnknownUser() throws Exception {
        when(noteService.get("user1")).thenThrow(new AuthException(401, "Unauthorized"));

        mockMvc.perform(get("/api/note").with(userAuth()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Unauthorized"));
    }

    @Test
    @DisplayName("PATCH /api/note with merge-patch returns 200")
    void patchReturnsOk() throws Exception {
        when(noteService.patch(eq("user1"), any())).thenReturn(new NoteDto(1L, "New", "Body"));

        mockMvc.perform(patch("/api/note")
                        .with(userAuth())
                        .contentType(MERGE_PATCH)
                        .content("{\"title\":\"New\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("New"));
    }

    @Test
    @DisplayName("PATCH /api/note with application/json returns 415 and Accept-Patch")
    void patchWrongMediaType() throws Exception {
        mockMvc.perform(patch("/api/note")
                        .with(userAuth())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(header().string(HttpHeaders.ACCEPT_PATCH, NoteController.MERGE_PATCH));
    }

    @Test
    @DisplayName("PATCH /api/note maps text null to 422")
    void patchTextNull() throws Exception {
        when(noteService.patch(eq("user1"), any()))
                .thenThrow(new NoteException(422, "text cannot be null"));

        mockMvc.perform(patch("/api/note")
                        .with(userAuth())
                        .contentType(MERGE_PATCH)
                        .content("{\"text\":null}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.message").value("text cannot be null"));
    }

    @Test
    @DisplayName("PATCH /api/note without a resource returns 404")
    void patchMissingNote() throws Exception {
        when(noteService.patch(eq("user1"), any()))
                .thenThrow(new NoteException(404, "Note not found"));

        mockMvc.perform(patch("/api/note")
                        .with(userAuth())
                        .contentType(MERGE_PATCH)
                        .content("{}"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /api/note returns 204")
    void deleteReturnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/note").with(userAuth()))
                .andExpect(status().isNoContent());

        verify(noteService).delete("user1");
    }

    @Test
    @DisplayName("DELETE /api/note without a resource returns 404")
    void deleteMissingNote() throws Exception {
        org.mockito.Mockito.doThrow(new NoteException(404, "Note not found"))
                .when(noteService).delete("user1");

        mockMvc.perform(delete("/api/note").with(userAuth()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Note not found"));
    }

    @Test
    @DisplayName("DELETE /api/note without token returns 401")
    void deleteRequiresAuthentication() throws Exception {
        mockMvc.perform(delete("/api/note"))
                .andExpect(status().isUnauthorized());
    }

    private static RequestPostProcessor userAuth() {
        return authentication(new UsernamePasswordAuthenticationToken("user1", null, List.of()));
    }
}
