package helpers;

import java.util.UUID;

/**
 * Throwaway identities for native e2e. The web cell keeps DataFaker/UserBuilder;
 * this is the slice Login / Register / DeleteAccount need.
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

    /** Unique login within backend {@code @Size(min = 3, max = 64)}. */
    public static String username() {
        return "u" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }

    public static String password() {
        return "password123";
    }
}
