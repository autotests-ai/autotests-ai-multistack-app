package tests.testinfra;

import tests.AllureMeta;
import annotations.Layer;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import helpers.TokensCss;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Layer("harness")
@Epic("Test harness")
@Feature("Tokens CSS")
@Severity(SeverityLevel.NORMAL)
@Tag("harness")
@Tag("harness-frontend")
@DisplayName("TokensCss")
class TokensCssTest extends AllureMeta {

    @ParameterizedTest
    @MethodSource("canonicalSizeTokens")
    @DisplayName("tokens.css keeps canonical component size tokens")
    void tokensMatchComponentSizesCanon(String token, String expected) throws Exception {
        var tokens = TokensCss.parseRootTokens(TokensCss.defaultTokensPath());
        assertTrue(tokens.containsKey(token), "Missing token: " + token);
        assertEquals(expected, tokens.get(token));
    }

    static Stream<Arguments> canonicalSizeTokens() {
        return Stream.of(
                Arguments.of("--control-height-md", "36px"),
                Arguments.of("--icon-size-md", "18px"),
                Arguments.of("--input-min-width", "200px"),
                Arguments.of("--header-height", "40px")
        );
    }

    @Test
    @DisplayName("defaultTokensPath resolves an existing tokens.css")
    void defaultTokensPathResolvesExistingFile() {
        assertTrue(Files.exists(TokensCss.defaultTokensPath()));
    }

    @Test
    @DisplayName("firstExisting returns the first path that exists")
    void firstExistingReturnsFirstHit(@TempDir Path temp) throws Exception {
        var missing = temp.resolve("missing.css");
        var hit = temp.resolve("hit.css");
        var later = temp.resolve("later.css");
        Files.writeString(hit, ":root { --x: 1px; }");
        Files.writeString(later, ":root { --y: 2px; }");

        assertEquals(hit, TokensCss.firstExisting(missing, hit, later));
    }

    @Test
    @DisplayName("firstExisting returns the last path when none exist")
    void firstExistingReturnsLastWhenNoneExist(@TempDir Path temp) {
        var missing = temp.resolve("missing.css");
        var fallback = temp.resolve("fallback.css");

        assertEquals(fallback, TokensCss.firstExisting(missing, fallback));
    }

    @Test
    @DisplayName("resolveTokensCssPath prefers frontend candidate")
    void resolveTokensCssPathPrefersFrontendCandidate(@TempDir Path temp) throws Exception {
        var frontend = temp.resolve("tokens.css");
        var backend = temp.resolve("backend-tokens.css");
        Files.writeString(frontend, ":root { --x: 1px; }");
        Files.writeString(backend, ":root { --y: 2px; }");

        assertEquals(frontend, TokensCss.resolveTokensCssPath(frontend, backend));
    }

    @Test
    @DisplayName("resolveTokensCssPath falls back to backend candidate")
    void resolveTokensCssPathFallsBackToBackendCandidate(@TempDir Path temp) throws Exception {
        var frontend = temp.resolve("missing-tokens.css");
        var backend = temp.resolve("backend-tokens.css");
        Files.writeString(backend, ":root { --y: 2px; }");

        assertEquals(backend, TokensCss.resolveTokensCssPath(frontend, backend));
    }

    @Test
    @DisplayName("parseRootTokens rejects css without :root block")
    void parseRootTokensRejectsMissingRootBlock(@TempDir Path temp) throws Exception {
        var css = temp.resolve("tokens-invalid.css");
        Files.writeString(css, "body { color: red; }");

        assertThrows(IllegalArgumentException.class, () -> TokensCss.parseRootTokens(css));
    }
}
