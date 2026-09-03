/// Throwaway test identity for register / delete-account.
#[derive(Debug, Clone)]
pub struct User {
    pub username: String,
    pub password: String,
}

impl User {
    pub fn welcome_message(&self) -> String {
        format!("Welcome, {}!", self.username)
    }
}

/// Throwaway test identity. Faker methods are for register / delete-account.
#[derive(Debug, Default)]
pub struct UserBuilder {
    username: String,
    password: String,
}

impl UserBuilder {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn with_username(mut self) -> Self {
        self.username = faker_username();
        self
    }

    pub fn with_password(mut self) -> Self {
        self.password = faker_password();
        self
    }

    pub fn build(self) -> User {
        User {
            username: self.username,
            password: self.password,
        }
    }
}

/// Username fits backend Size(min = 3, max = 64). C# `user_{guid:N}[..16]`.
pub fn faker_username() -> String {
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let mut name = format!("user_{nanos:x}");
    name.truncate(16);
    if name.len() < 3 {
        "user_x".into()
    } else {
        name
    }
}

pub fn faker_password() -> String {
    "password123".into()
}
