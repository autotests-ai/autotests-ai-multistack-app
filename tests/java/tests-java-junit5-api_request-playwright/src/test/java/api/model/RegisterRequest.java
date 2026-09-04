package api.model;

/** Request body for {@code POST /api/auth/register} — serialized to JSON for Playwright APIRequest. */
public record RegisterRequest(String username, String password) {
}
