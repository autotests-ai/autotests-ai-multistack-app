package dev.multistack.app.integration;

import dev.multistack.app.allure.IntegrationTestBase;
import dev.multistack.app.dto.AuthResponse;
import dev.multistack.app.dto.NoteDto;
import dev.multistack.app.dto.NotePutRequest;
import dev.multistack.app.dto.RegisterRequest;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Epic("Note")
@Feature("Note lifecycle")
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Note singleton lifecycle in-process")
class NoteLifecycleIntegrationTest extends IntegrationTestBase {

    @Test
    @DisplayName("PUT 201/200 → GET → PATCH merge-patch → DELETE 204; another JWT is 404")
    void noteLifecycleRoundTrip() {
        String token = registerToken("note_" + UUID.randomUUID().toString().substring(0, 8));
        String otherToken = registerToken("note_" + UUID.randomUUID().toString().substring(0, 8));

        ResponseEntity<String> missing = rest.exchange(
                "/api/note", HttpMethod.GET, bearerEntity(token), String.class);
        assertEquals(HttpStatus.NOT_FOUND, missing.getStatusCode());

        ResponseEntity<NoteDto> created = rest.exchange(
                "/api/note",
                HttpMethod.PUT,
                jsonBearerEntity(new NotePutRequest("Title", "Body"), token),
                NoteDto.class);
        assertEquals(HttpStatus.CREATED, created.getStatusCode());
        assertEquals("/api/note", created.getHeaders().getFirst(HttpHeaders.CONTENT_LOCATION));
        assertNotNull(created.getBody());
        Long id = created.getBody().id();
        assertEquals("Title", created.getBody().title());
        assertEquals("Body", created.getBody().text());

        ResponseEntity<NoteDto> replaced = rest.exchange(
                "/api/note",
                HttpMethod.PUT,
                jsonBearerEntity(new NotePutRequest("", "Replaced"), token),
                NoteDto.class);
        assertEquals(HttpStatus.OK, replaced.getStatusCode());
        assertNotNull(replaced.getBody());
        assertEquals(id, replaced.getBody().id());
        assertEquals("", replaced.getBody().title());
        assertEquals("Replaced", replaced.getBody().text());

        ResponseEntity<NoteDto> fetched = rest.exchange(
                "/api/note", HttpMethod.GET, bearerEntity(token), NoteDto.class);
        assertEquals(HttpStatus.OK, fetched.getStatusCode());
        assertNotNull(fetched.getBody());
        assertEquals(id, fetched.getBody().id());

        ResponseEntity<String> otherGet = rest.exchange(
                "/api/note", HttpMethod.GET, bearerEntity(otherToken), String.class);
        assertEquals(HttpStatus.NOT_FOUND, otherGet.getStatusCode());

        ResponseEntity<NoteDto> patched = rest.exchange(
                "/api/note",
                HttpMethod.PATCH,
                mergePatchBearerEntity("{\"title\":\"Patched\"}", token),
                NoteDto.class);
        assertEquals(HttpStatus.OK, patched.getStatusCode());
        assertNotNull(patched.getBody());
        assertEquals("Patched", patched.getBody().title());
        assertEquals("Replaced", patched.getBody().text());

        ResponseEntity<NoteDto> noOp = rest.exchange(
                "/api/note",
                HttpMethod.PATCH,
                mergePatchBearerEntity("{}", token),
                NoteDto.class);
        assertEquals(HttpStatus.OK, noOp.getStatusCode());
        assertNotNull(noOp.getBody());
        assertEquals("Patched", noOp.getBody().title());

        ResponseEntity<String> textNull = rest.exchange(
                "/api/note",
                HttpMethod.PATCH,
                mergePatchBearerEntity("{\"text\":null}", token),
                String.class);
        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, textNull.getStatusCode());
        assertTrue(textNull.getBody() != null && textNull.getBody().contains("text cannot be null"));

        ResponseEntity<String> wrongType = rest.exchange(
                "/api/note",
                HttpMethod.PATCH,
                jsonBearerEntity("{}", token),
                String.class);
        assertEquals(HttpStatus.UNSUPPORTED_MEDIA_TYPE, wrongType.getStatusCode());
        assertEquals("application/merge-patch+json", wrongType.getHeaders().getFirst(HttpHeaders.ACCEPT_PATCH));

        ResponseEntity<Void> deleted = rest.exchange(
                "/api/note", HttpMethod.DELETE, bearerEntity(token), Void.class);
        assertEquals(HttpStatus.NO_CONTENT, deleted.getStatusCode());

        ResponseEntity<String> afterDelete = rest.exchange(
                "/api/note", HttpMethod.GET, bearerEntity(token), String.class);
        assertEquals(HttpStatus.NOT_FOUND, afterDelete.getStatusCode());

        ResponseEntity<String> deleteAgain = rest.exchange(
                "/api/note", HttpMethod.DELETE, bearerEntity(token), String.class);
        assertEquals(HttpStatus.NOT_FOUND, deleteAgain.getStatusCode());
    }

    @Test
    @DisplayName("deleting the account with a note does not 500 (FK cascade)")
    void deleteAccountWithNoteCascades() {
        String username = "note_" + UUID.randomUUID().toString().substring(0, 8);
        String token = registerToken(username);

        ResponseEntity<NoteDto> created = rest.exchange(
                "/api/note",
                HttpMethod.PUT,
                jsonBearerEntity(new NotePutRequest("Keep", "until account gone"), token),
                NoteDto.class);
        assertEquals(HttpStatus.CREATED, created.getStatusCode());

        ResponseEntity<Void> deleted = rest.exchange(
                "/api/auth/me", HttpMethod.DELETE, bearerEntity(token), Void.class);
        assertEquals(HttpStatus.NO_CONTENT, deleted.getStatusCode());

        ResponseEntity<String> afterAccountGone = rest.exchange(
                "/api/note", HttpMethod.GET, bearerEntity(token), String.class);
        assertEquals(HttpStatus.UNAUTHORIZED, afterAccountGone.getStatusCode());
    }

    @Test
    @DisplayName("PUT /api/note without a token is 401")
    void putRequiresAuthentication() {
        ResponseEntity<String> response = rest.exchange(
                "/api/note",
                HttpMethod.PUT,
                jsonEntity(new NotePutRequest("Title", "Body")),
                String.class);
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    private String registerToken(String username) {
        ResponseEntity<AuthResponse> register = rest.postForEntity(
                "/api/auth/register",
                jsonEntity(new RegisterRequest(username, "password123")),
                AuthResponse.class);
        assertEquals(HttpStatus.CREATED, register.getStatusCode());
        assertNotNull(register.getBody());
        return register.getBody().token();
    }
}
