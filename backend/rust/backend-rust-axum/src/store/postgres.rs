use std::time::Duration;

use sqlx::PgPool;

use super::{split_statements, Item, Store, StoreError, User};

pub struct Postgres {
    pool: PgPool,
}

impl Postgres {
    pub async fn open(database_url: &str) -> Result<Self, sqlx::Error> {
        let pool = sqlx::postgres::PgPoolOptions::new()
            .max_connections(10)
            .connect(database_url)
            .await?;
        Ok(Self { pool })
    }

    pub async fn wait_ready(&self, timeout: Duration) -> Result<(), sqlx::Error> {
        let deadline = std::time::Instant::now() + timeout;
        let mut attempt = 1;
        loop {
            match sqlx::query("SELECT 1").execute(&self.pool).await {
                Ok(_) => return Ok(()),
                Err(err) if std::time::Instant::now() >= deadline => {
                    return Err(sqlx::Error::Configuration(
                        format!("database not ready after {attempt} attempts: {err}").into(),
                    ));
                }
                Err(_) => {
                    attempt += 1;
                    tokio::time::sleep(Duration::from_secs(1)).await;
                }
            }
        }
    }

    pub async fn apply_schema(&self, schema: &str) -> Result<(), sqlx::Error> {
        for statement in split_statements(schema) {
            sqlx::query(&statement).execute(&self.pool).await?;
        }
        Ok(())
    }
}

#[async_trait::async_trait]
impl Store for Postgres {
    async fn list_items(&self) -> Result<Vec<Item>, sqlx::Error> {
        sqlx::query_as::<_, ItemRow>("SELECT id, name, description FROM items ORDER BY id")
            .fetch_all(&self.pool)
            .await
            .map(|rows| rows.into_iter().map(ItemRow::into_item).collect())
    }

    async fn count_items(&self) -> Result<i64, sqlx::Error> {
        let row: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM items")
            .fetch_one(&self.pool)
            .await?;
        Ok(row.0)
    }

    async fn insert_item(&self, name: &str, description: &str) -> Result<(), sqlx::Error> {
        sqlx::query("INSERT INTO items (name, description) VALUES ($1, $2)")
            .bind(name)
            .bind(description)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    async fn find_user_by_username(&self, username: &str) -> Result<User, StoreError> {
        match sqlx::query_as::<_, UserRow>(
            "SELECT id, username, password_hash FROM users WHERE username = $1",
        )
        .bind(username)
        .fetch_optional(&self.pool)
        .await?
        {
            Some(row) => Ok(row.into_user()),
            None => Err(StoreError::NotFound),
        }
    }

    async fn create_user(&self, username: &str, password_hash: &str) -> Result<User, StoreError> {
        let result = sqlx::query_as::<_, UserRow>(
            "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, password_hash",
        )
        .bind(username)
        .bind(password_hash)
        .fetch_one(&self.pool)
        .await;

        match result {
            Ok(row) => Ok(row.into_user()),
            Err(sqlx::Error::Database(db_err)) if db_err.code().as_deref() == Some("23505") => {
                Err(StoreError::Duplicate)
            }
            Err(err) => Err(StoreError::Sql(err)),
        }
    }

    async fn delete_user(&self, username: &str) -> Result<(), sqlx::Error> {
        sqlx::query("DELETE FROM users WHERE username = $1")
            .bind(username)
            .execute(&self.pool)
            .await?;
        Ok(())
    }
}

#[derive(sqlx::FromRow)]
struct ItemRow {
    id: i64,
    name: String,
    description: String,
}

impl ItemRow {
    fn into_item(self) -> Item {
        Item {
            id: self.id,
            name: self.name,
            description: self.description,
        }
    }
}

#[derive(sqlx::FromRow)]
struct UserRow {
    id: i64,
    username: String,
    password_hash: String,
}

impl UserRow {
    fn into_user(self) -> User {
        User {
            id: self.id,
            username: self.username,
            password_hash: self.password_hash,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::store::{seed, Store, StoreError, SEED_USERNAME};
    use std::path::PathBuf;
    use std::time::{Duration, SystemTime, UNIX_EPOCH};

    fn hash_stub(password: &str) -> Result<String, std::io::Error> {
        Ok(format!("hash:{password}"))
    }

    async fn open_postgres() -> Option<Postgres> {
        let dsn = std::env::var("TEST_DATABASE_URL").unwrap_or_default();
        if dsn.is_empty() {
            eprintln!("skip: set TEST_DATABASE_URL to a scratch database");
            return None;
        }
        let pg = Postgres::open(&dsn).await.expect("Open");
        pg.wait_ready(Duration::from_secs(30))
            .await
            .expect("WaitReady");
        let schema = std::fs::read_to_string(
            PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("schema.sql"),
        )
        .expect("read schema.sql");
        pg.apply_schema(&schema).await.expect("ApplySchema");
        Some(pg)
    }

    #[tokio::test]
    async fn postgres_items() {
        let Some(pg) = open_postgres().await else {
            return;
        };
        let before = pg.count_items().await.unwrap();
        let name = format!(
            "Item-{}",
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        );
        pg.insert_item(&name, "inserted by the integration test")
            .await
            .unwrap();
        let after = pg.count_items().await.unwrap();
        assert_eq!(after, before + 1);
        let items = pg.list_items().await.unwrap();
        assert_eq!(items.len() as i64, after);
        for window in items.windows(2) {
            assert!(window[0].id < window[1].id);
        }
        assert_eq!(items.last().unwrap().name, name);
    }

    #[tokio::test]
    async fn postgres_users() {
        let Some(pg) = open_postgres().await else {
            return;
        };
        let username = format!(
            "integration-{}",
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        );
        let created = pg.create_user(&username, "hash").await.unwrap();
        assert_ne!(created.id, 0);
        let found = pg.find_user_by_username(&username).await.unwrap();
        assert_eq!(found.id, created.id);
        assert_eq!(found.password_hash, "hash");

        let duplicate = pg.create_user(&username, "hash").await.unwrap_err();
        assert!(matches!(duplicate, StoreError::Duplicate));

        let missing = pg
            .find_user_by_username(&format!("{username}-missing"))
            .await
            .unwrap_err();
        assert!(matches!(missing, StoreError::NotFound));

        pg.delete_user(&username).await.unwrap();
        let after_delete = pg.find_user_by_username(&username).await.unwrap_err();
        assert!(matches!(after_delete, StoreError::NotFound));
        pg.delete_user(&username).await.unwrap();
    }

    #[tokio::test]
    async fn postgres_seed_is_idempotent() {
        let Some(pg) = open_postgres().await else {
            return;
        };
        seed(&pg, hash_stub).await.unwrap();
        let first = pg.count_items().await.unwrap();
        seed(&pg, hash_stub).await.unwrap();
        let second = pg.count_items().await.unwrap();
        assert_eq!(first, second);
        pg.find_user_by_username(SEED_USERNAME).await.unwrap();
    }
}
