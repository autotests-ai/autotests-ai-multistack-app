mod cors;
mod dto;
mod handlers;
mod openapi;

use std::sync::Arc;

use axum::{
    middleware,
    routing::{get, post},
    Router,
};
use tower_http::trace::TraceLayer;

use crate::security::TokenService;
use crate::store::Store;

pub use handlers::AppState;

pub fn router(state: Arc<AppState>) -> Router {
    let api = Router::new()
        .route("/health", get(handlers::health))
        .route("/items", get(handlers::items))
        .route("/openapi.yaml", get(openapi::spec))
        .route("/docs", get(openapi::docs))
        .route("/auth/register", post(handlers::register))
        .route("/auth/login", post(handlers::login))
        .route("/auth/logout", post(handlers::logout))
        .route(
            "/auth/me",
            get(handlers::me)
                .delete(handlers::delete_account)
                .route_layer(middleware::from_fn_with_state(
                    state.clone(),
                    handlers::require_auth,
                )),
        )
        .fallback(handlers::api_fallback)
        .method_not_allowed_fallback(handlers::api_fallback)
        .layer(middleware::from_fn(cors::middleware))
        .with_state(state.clone());

    Router::new()
        .nest("/api", api)
        .layer(TraceLayer::new_for_http())
}

pub fn test_router(store: Arc<dyn Store>, tokens: Arc<TokenService>) -> Router {
    let state = Arc::new(AppState {
        store,
        tokens,
        service_name: "backend-rust-axum".to_string(),
    });
    router(state)
}
