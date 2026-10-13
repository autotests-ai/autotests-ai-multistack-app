package helpers;

import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Throwaway test identities. Username fits backend {@code @Size(min = 3, max = 64)}.
 */
public final class DataFaker {

    private DataFaker() {
    }

    /** Exactly backend {@code @Size(min = 3)} — a-z0-9, 46656-strong namespace on the stand. */
    public static String usernameAtMinLength() {
        String alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder username = new StringBuilder(3);
        for (int i = 0; i < 3; i++) {
            username.append(alphabet.charAt(ThreadLocalRandom.current().nextInt(alphabet.length())));
        }
        return username.toString();
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
