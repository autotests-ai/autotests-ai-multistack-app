package api.model;

/** Request body for {@code POST /api/auth/register} — serialized by Jackson for the in-cell Ktor client. */
public record RegisterRequest(String username, String password) {
}
