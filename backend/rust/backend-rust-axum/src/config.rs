use std::time::Duration;

pub const SERVICE_NAME: &str = "backend-rust-axum";
pub const POST_AUTH_REDIRECT: &str = "/";

const DEFAULT_DATABASE_NAME: &str = "multistack_app_rust_axum";
const DEFAULT_SERVER_PORT: &str = "8080";
const DEFAULT_MANAGEMENT_PORT: &str = "8081";
const DEFAULT_JWT_SECRET: &str = "multistack-dev-secret-change-in-production-min-32-chars";
const DEFAULT_EXPIRATION_MS: i64 = 86_400_000;

#[derive(Debug, Clone)]
pub struct Config {
    pub service_name: String,
    pub server_port: String,
    pub management_port: String,
    pub database_url: String,
    pub jwt_secret: String,
    pub jwt_expiration: Duration,
}

pub fn load() -> Config {
    Config {
        service_name: SERVICE_NAME.to_string(),
        server_port: env("SERVER_PORT", DEFAULT_SERVER_PORT),
        management_port: env("MANAGEMENT_PORT", DEFAULT_MANAGEMENT_PORT),
        database_url: database_url(),
        jwt_secret: env("JWT_SECRET", DEFAULT_JWT_SECRET),
        jwt_expiration: jwt_expiration(),
    }
}

pub fn database_url() -> String {
    if let Ok(raw) = std::env::var("DATABASE_URL") {
        if !raw.is_empty() {
            return raw;
        }
    }
    let user = env("DB_USER", "multistack");
    let password = env("DB_PASSWORD", "multistack");
    let host = env("DB_HOST", "localhost");
    let port = env("DB_PORT", "5432");
    let name = env("DB_NAME", DEFAULT_DATABASE_NAME);
    format!(
        "postgres://{user}:{}@{host}:{port}/{name}?sslmode=disable",
        urlencoding(&password)
    )
}

fn urlencoding(value: &str) -> String {
    value
        .chars()
        .map(|ch| match ch {
            'A'..='Z' | 'a'..='z' | '0'..='9' | '-' | '_' | '.' | '~' => ch.to_string(),
            _ => format!("%{:02X}", ch as u8),
        })
        .collect()
}

pub fn jwt_expiration() -> Duration {
    let ms = std::env::var("JWT_EXPIRATION_MS")
        .ok()
        .and_then(|raw| raw.parse::<i64>().ok())
        .filter(|value| *value > 0)
        .unwrap_or(DEFAULT_EXPIRATION_MS);
    Duration::from_millis(ms as u64)
}

fn env(key: &str, fallback: &str) -> String {
    std::env::var(key).unwrap_or_else(|_| fallback.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Mutex;

    static ENV_LOCK: Mutex<()> = Mutex::new(());

    fn clear_env() {
        for key in [
            "DATABASE_URL",
            "DB_HOST",
            "DB_PORT",
            "DB_NAME",
            "DB_USER",
            "DB_PASSWORD",
            "SERVER_PORT",
            "MANAGEMENT_PORT",
            "JWT_SECRET",
            "JWT_EXPIRATION_MS",
        ] {
            unsafe { std::env::remove_var(key) };
        }
    }

    #[test]
    fn load_defaults() {
        let _guard = ENV_LOCK.lock().unwrap();
        clear_env();
        let cfg = load();
        assert_eq!(cfg.service_name, "backend-rust-axum");
        assert_eq!(cfg.server_port, "8080");
        assert_eq!(cfg.management_port, "8081");
        assert_eq!(
            cfg.database_url,
            "postgres://multistack:multistack@localhost:5432/multistack_app_rust_axum?sslmode=disable"
        );
        assert_eq!(cfg.jwt_secret, DEFAULT_JWT_SECRET);
        assert_eq!(cfg.jwt_expiration, Duration::from_millis(86_400_000));
    }

    #[test]
    fn load_from_environment() {
        let _guard = ENV_LOCK.lock().unwrap();
        clear_env();
        unsafe {
            std::env::set_var("DB_HOST", "postgres");
            std::env::set_var("DB_PORT", "55440");
            std::env::set_var("DB_NAME", "other_db");
            std::env::set_var("DB_USER", "someone");
            std::env::set_var("DB_PASSWORD", "p@ss word");
            std::env::set_var("SERVER_PORT", "18830");
            std::env::set_var("MANAGEMENT_PORT", "18831");
            std::env::set_var("JWT_SECRET", "custom");
            std::env::set_var("JWT_EXPIRATION_MS", "1000");
        }
        let cfg = load();
        assert_eq!(cfg.server_port, "18830");
        assert_eq!(cfg.management_port, "18831");
        assert_eq!(cfg.jwt_secret, "custom");
        assert_eq!(cfg.jwt_expiration, Duration::from_secs(1));
        assert_eq!(
            cfg.database_url,
            "postgres://someone:p%40ss%20word@postgres:55440/other_db?sslmode=disable"
        );
    }

    #[test]
    fn database_url_override() {
        let _guard = ENV_LOCK.lock().unwrap();
        clear_env();
        unsafe {
            std::env::set_var("DB_HOST", "ignored");
            std::env::set_var("DATABASE_URL", "postgres://u:p@db:5432/explicit");
        }
        assert_eq!(database_url(), "postgres://u:p@db:5432/explicit");
    }

    #[test]
    fn jwt_expiration_falls_back_on_bad_values() {
        let _guard = ENV_LOCK.lock().unwrap();
        for raw in ["not-a-number", "0", "-5"] {
            unsafe { std::env::set_var("JWT_EXPIRATION_MS", raw) };
            assert_eq!(
                jwt_expiration(),
                Duration::from_millis(86_400_000),
                "{raw}"
            );
        }
    }
}
