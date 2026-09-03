pub mod api;
pub mod config;
pub mod security;
pub mod store;

use std::sync::Arc;

use axum::Router;

use crate::api::AppState;
use crate::security::TokenService;
use crate::store::{Postgres, Store};

pub fn build_router(state: Arc<AppState>) -> Router {
    api::router(state)
}

pub async fn run(state: Arc<AppState>, listener: tokio::net::TcpListener) -> Result<(), std::io::Error> {
    let app = build_router(state);
    axum::serve(listener, app).await
}

pub async fn bootstrap(config: &config::Config) -> Result<Arc<AppState>, Box<dyn std::error::Error + Send + Sync>> {
    let pg = Postgres::open(&config.database_url).await?;
    pg.wait_ready(std::time::Duration::from_secs(60)).await?;
    let schema = std::fs::read_to_string("schema.sql")?;
    pg.apply_schema(&schema).await?;
    store::seed(&pg, security::hash_password).await?;

    let store: Arc<dyn Store> = Arc::new(pg);
    let tokens = Arc::new(TokenService::new(config.jwt_secret.clone(), config.jwt_expiration));
    Ok(Arc::new(AppState {
        store,
        tokens,
        service_name: config.service_name.clone(),
    }))
}
