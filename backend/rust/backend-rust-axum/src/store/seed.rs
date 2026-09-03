use super::{Store, StoreError};

pub const SEED_USERNAME: &str = "user1";
pub const SEED_PASSWORD: &str = "password1";

pub struct SeedItem {
    pub name: &'static str,
    pub description: &'static str,
}

pub const SEED_ITEMS: [SeedItem; 3] = [
    SeedItem {
        name: "Alpha",
        description: "First seeded item from PostgreSQL",
    },
    SeedItem {
        name: "Beta",
        description: "Second seeded item for demo API",
    },
    SeedItem {
        name: "Gamma",
        description: "Third item — multistack bootstrap",
    },
];

pub async fn seed<S, F, E>(
    store: &S,
    hash: F,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>>
where
    S: Store,
    F: Fn(&str) -> Result<String, E>,
    E: Into<Box<dyn std::error::Error + Send + Sync>>,
{
    let count = store.count_items().await?;
    if count == 0 {
        for item in SEED_ITEMS {
            store.insert_item(item.name, item.description).await?;
        }
    }

    match store.find_user_by_username(SEED_USERNAME).await {
        Ok(_) => return Ok(()),
        Err(StoreError::NotFound) => {}
        Err(err) => return Err(err.into()),
    }

    let password_hash = hash(SEED_PASSWORD).map_err(Into::into)?;
    match store.create_user(SEED_USERNAME, &password_hash).await {
        Ok(_) | Err(StoreError::Duplicate) => Ok(()),
        Err(err) => Err(err.into()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::store::FakeStore;

    fn hash_stub(password: &str) -> Result<String, std::io::Error> {
        Ok(format!("hash:{password}"))
    }

    #[tokio::test]
    async fn fills_empty_database() {
        let fake = FakeStore::new();
        seed(&fake, hash_stub).await.unwrap();
        let items = fake.items();
        assert_eq!(items.len(), SEED_ITEMS.len());
        for (got, want) in items.iter().zip(SEED_ITEMS.iter()) {
            assert_eq!(got.name, want.name);
            assert_eq!(got.description, want.description);
        }
        assert_eq!(
            items[2].description,
            "Third item — multistack bootstrap"
        );
        let user = fake.find_user_by_username(SEED_USERNAME).await.unwrap();
        assert_eq!(user.password_hash, format!("hash:{SEED_PASSWORD}"));
    }

    #[tokio::test]
    async fn is_idempotent() {
        let fake = FakeStore::new();
        seed(&fake, hash_stub).await.unwrap();
        seed(&fake, hash_stub).await.unwrap();
        assert_eq!(fake.items().len(), SEED_ITEMS.len());
        assert_eq!(fake.users().len(), 1);
    }

    #[tokio::test]
    async fn keeps_existing_items() {
        let fake = FakeStore::new().with_item("Custom", "Left alone");
        seed(&fake, hash_stub).await.unwrap();
        assert_eq!(fake.items().len(), 1);
    }

    #[tokio::test]
    async fn tolerates_lost_race() {
        let fake = FakeStore::new();
        fake.fail_create_user_duplicate();
        seed(&fake, hash_stub).await.unwrap();
    }

    #[tokio::test]
    async fn propagates_errors() {
        let cases: &[(&str, fn(&FakeStore))] = &[
            ("count", FakeStore::fail_count_items),
            ("insert", FakeStore::fail_insert_item),
            ("find", FakeStore::fail_find_user),
            ("create", FakeStore::fail_create_user),
        ];
        for (name, break_it) in cases {
            let fake = FakeStore::new();
            break_it(&fake);
            let err = seed(&fake, hash_stub).await.unwrap_err();
            assert!(
                err.to_string().contains("db down"),
                "{name}: {err}"
            );
        }
    }

    #[tokio::test]
    async fn propagates_hash_failure() {
        let hash = |_: &str| -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
            Err("bcrypt refused".into())
        };
        let err = seed(&FakeStore::new(), hash).await.unwrap_err();
        assert_eq!(err.to_string(), "bcrypt refused");
    }
}
