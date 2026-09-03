pub mod fake;
mod postgres;
mod seed;

pub use fake::FakeStore;
pub use postgres::Postgres;
pub use seed::{seed, SeedItem, SEED_ITEMS, SEED_PASSWORD, SEED_USERNAME};

use async_trait::async_trait;
use thiserror::Error;

#[derive(Debug, Clone)]
pub struct Item {
    pub id: i64,
    pub name: String,
    pub description: String,
}

#[derive(Debug, Clone)]
pub struct User {
    pub id: i64,
    pub username: String,
    pub password_hash: String,
}

#[async_trait]
pub trait Store: Send + Sync {
    async fn list_items(&self) -> Result<Vec<Item>, sqlx::Error>;
    async fn count_items(&self) -> Result<i64, sqlx::Error>;
    async fn insert_item(&self, name: &str, description: &str) -> Result<(), sqlx::Error>;
    async fn find_user_by_username(&self, username: &str) -> Result<User, StoreError>;
    async fn create_user(&self, username: &str, password_hash: &str) -> Result<User, StoreError>;
    async fn delete_user(&self, username: &str) -> Result<(), sqlx::Error>;
}

#[derive(Debug, Error)]
pub enum StoreError {
    #[error(transparent)]
    Sql(#[from] sqlx::Error),
    #[error("user not found")]
    NotFound,
    #[error("duplicate username")]
    Duplicate,
}

pub fn split_statements(schema: &str) -> Vec<String> {
    schema
        .split(';')
        .map(str::trim)
        .filter(|chunk| !chunk.is_empty())
        .map(str::to_string)
        .collect()
}

#[cfg(test)]
mod tests {
    use super::split_statements;

    #[test]
    fn split_statements_keeps_sql() {
        let statements = split_statements(
            "
CREATE TABLE IF NOT EXISTS items (
    id BIGSERIAL PRIMARY KEY
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
",
        );
        assert_eq!(statements.len(), 2);
        assert_eq!(
            statements[1],
            "CREATE INDEX IF NOT EXISTS idx_users_username ON users (username)"
        );
    }

    #[test]
    fn split_statements_ignores_blanks() {
        assert!(split_statements("  \n ; ;\n").is_empty());
    }
}
