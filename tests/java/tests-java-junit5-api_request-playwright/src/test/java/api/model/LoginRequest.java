package api.model;

/** Request body for {@code POST /api/auth/login} — serialized to JSON for Playwright APIRequest. */
public record LoginRequest(String username, String password) {
}
