package helpers;

import java.util.UUID;

/**
 * Boundary identities for native e2e. Full throwaway catalog stays in the web
 * Selenide cell; this is only the 3/6-character pair LoginTests needs.
 */
public final class DataFaker {

    private DataFaker() {
    }

    /** Exactly backend {@code @Size(min = 3)} — unique hex slice. */
    public static String usernameAtMinLength() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 3);
    }

    /** Exactly backend {@code @Size(min = 6)}. */
    public static String passwordAtMinLength() {
        return "123456";
    }
}
