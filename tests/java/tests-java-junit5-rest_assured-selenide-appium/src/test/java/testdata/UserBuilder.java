package testdata;

import helpers.DataFaker;

/**
 * Throwaway test identity. Faker methods are for register / delete-account.
 */
public final class UserBuilder {

    private String username;
    private String password;

    public UserBuilder withUsername() {
        this.username = DataFaker.username();
        return this;
    }

    public UserBuilder withPassword() {
        this.password = DataFaker.password();
        return this;
    }

    /** Exactly backend {@code @Size(min = 3)} login and {@code @Size(min = 6)} password. */
    public UserBuilder withMinLengthCredentials() {
        this.username = DataFaker.usernameAtMinLength();
        this.password = DataFaker.passwordAtMinLength();
        return this;
    }

    public User build() {
        return new User(username, password);
    }
}
