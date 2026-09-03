use std::sync::Mutex;

use super::{Item, Store, StoreError, User};

/// In-memory store. Any of the `fail_*` flags short-circuits the matching method,
/// which is how tests exercise the 500 / 409 paths.
pub struct FakeStore {
    inner: Mutex<FakeInner>,
}

struct FakeInner {
    items: Vec<Item>,
    users: Vec<User>,
    next_item_id: i64,
    next_user_id: i64,
    list_items_err: bool,
    count_items_err: bool,
    insert_item_err: bool,
    find_user_err: Option<InjectedUserError>,
    create_user_err: Option<InjectedUserError>,
    delete_user_err: bool,
}

#[derive(Clone, Copy)]
enum InjectedUserError {
    Sql,
    Duplicate,
}

impl Default for FakeInner {
    fn default() -> Self {
        Self {
            items: Vec::new(),
            users: Vec::new(),
            next_item_id: 0,
            next_user_id: 0,
            list_items_err: false,
            count_items_err: false,
            insert_item_err: false,
            find_user_err: None,
            create_user_err: None,
            delete_user_err: false,
        }
    }
}

fn db_down() -> sqlx::Error {
    sqlx::Error::Protocol("db down".into())
}

impl FakeStore {
    pub fn new() -> Self {
        Self {
            inner: Mutex::new(FakeInner::default()),
        }
    }

    pub fn with_user(self, username: &str, password_hash: &str) -> Self {
        {
            let mut guard = self.inner.lock().unwrap();
            guard.next_user_id += 1;
            let id = guard.next_user_id;
            guard.users.push(User {
                id,
                username: username.to_string(),
                password_hash: password_hash.to_string(),
            });
        }
        self
    }

    pub fn with_item(self, name: &str, description: &str) -> Self {
        {
            let mut guard = self.inner.lock().unwrap();
            guard.next_item_id += 1;
            let id = guard.next_item_id;
            guard.items.push(Item {
                id,
                name: name.to_string(),
                description: description.to_string(),
            });
        }
        self
    }

    pub fn items(&self) -> Vec<Item> {
        self.inner.lock().unwrap().items.clone()
    }

    pub fn users(&self) -> Vec<User> {
        self.inner.lock().unwrap().users.clone()
    }

    pub fn fail_list_items(&self) {
        self.inner.lock().unwrap().list_items_err = true;
    }

    pub fn fail_count_items(&self) {
        self.inner.lock().unwrap().count_items_err = true;
    }

    pub fn fail_insert_item(&self) {
        self.inner.lock().unwrap().insert_item_err = true;
    }

    pub fn fail_find_user(&self) {
        self.inner.lock().unwrap().find_user_err = Some(InjectedUserError::Sql);
    }

    pub fn fail_create_user(&self) {
        self.inner.lock().unwrap().create_user_err = Some(InjectedUserError::Sql);
    }

    pub fn fail_create_user_duplicate(&self) {
        self.inner.lock().unwrap().create_user_err = Some(InjectedUserError::Duplicate);
    }

    pub fn fail_delete_user(&self) {
        self.inner.lock().unwrap().delete_user_err = true;
    }
}

#[async_trait::async_trait]
impl Store for FakeStore {
    async fn list_items(&self) -> Result<Vec<Item>, sqlx::Error> {
        let guard = self.inner.lock().unwrap();
        if guard.list_items_err {
            return Err(db_down());
        }
        Ok(guard.items.clone())
    }

    async fn count_items(&self) -> Result<i64, sqlx::Error> {
        let guard = self.inner.lock().unwrap();
        if guard.count_items_err {
            return Err(db_down());
        }
        Ok(guard.items.len() as i64)
    }

    async fn insert_item(&self, name: &str, description: &str) -> Result<(), sqlx::Error> {
        let mut guard = self.inner.lock().unwrap();
        if guard.insert_item_err {
            return Err(db_down());
        }
        guard.next_item_id += 1;
        let id = guard.next_item_id;
        guard.items.push(Item {
            id,
            name: name.to_string(),
            description: description.to_string(),
        });
        Ok(())
    }

    async fn find_user_by_username(&self, username: &str) -> Result<User, StoreError> {
        let guard = self.inner.lock().unwrap();
        if let Some(kind) = guard.find_user_err {
            return Err(match kind {
                InjectedUserError::Sql => StoreError::Sql(db_down()),
                InjectedUserError::Duplicate => StoreError::Duplicate,
            });
        }
        guard
            .users
            .iter()
            .find(|user| user.username == username)
            .cloned()
            .ok_or(StoreError::NotFound)
    }

    async fn create_user(&self, username: &str, password_hash: &str) -> Result<User, StoreError> {
        let mut guard = self.inner.lock().unwrap();
        if let Some(kind) = guard.create_user_err {
            return Err(match kind {
                InjectedUserError::Sql => StoreError::Sql(db_down()),
                InjectedUserError::Duplicate => StoreError::Duplicate,
            });
        }
        if guard.users.iter().any(|user| user.username == username) {
            return Err(StoreError::Duplicate);
        }
        guard.next_user_id += 1;
        let user = User {
            id: guard.next_user_id,
            username: username.to_string(),
            password_hash: password_hash.to_string(),
        };
        guard.users.push(user.clone());
        Ok(user)
    }

    async fn delete_user(&self, username: &str) -> Result<(), sqlx::Error> {
        let mut guard = self.inner.lock().unwrap();
        if guard.delete_user_err {
            return Err(db_down());
        }
        guard.users.retain(|user| user.username != username);
        Ok(())
    }
}
