package helpers;

import net.datafaker.Faker;

import java.util.UUID;

/**
 * Throwaway test identities. Username fits backend {@code @Size(min = 3, max = 64)}.
 */
public final class DataFaker {

    private static final Faker FAKER = new Faker();

    private DataFaker() {
    }

    public static String username() {
        String base = FAKER.internet().username().replaceAll("[^A-Za-z0-9]", "");
        if (base.length() < 3) {
            base = "user" + base;
        }
        if (base.length() > 48) {
            base = base.substring(0, 48);
        }
        return base + "_" + FAKER.number().digits(6);
    }

    /** Meets backend password {@code @Size(min = 6)}. */
    public static String password() {
        return FAKER.internet().password(8, 16);
    }

    /** Exactly {@code @Size(min = 3)} — unique hex slice. */
    public static String usernameAtMinLength() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 3);
    }

    /** Exactly {@code @Size(min = 6)}. */
    public static String passwordAtMinLength() {
        return "123456";
    }
}
