use std::sync::Arc;

use axum::{
    extract::{Extension, State},
    http::{header, HeaderMap, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
    Json,
};
use axum::body::Body;
use axum::http::Request;

use crate::config::POST_AUTH_REDIRECT;
use crate::security::{check_password, hash_password, Credentials, TokenService};
use crate::store::{Store, StoreError};

use super::dto::{
    AuthResponse, ErrorResponse, HealthResponse, ItemDto, ItemsResponse, ProfileResponse,
};

pub struct AppState {
    pub store: Arc<dyn Store>,
    pub tokens: Arc<TokenService>,
    pub service_name: String,
}

const MESSAGE_BAD_CREDENTIALS: &str = "Wrong login or password";
const MESSAGE_UNAUTHORIZED: &str = "Unauthorized";
const MESSAGE_DUPLICATE_USER: &str = "Username already taken";
const MESSAGE_INVALID_JSON: &str = "Request body is not valid JSON";
const MESSAGE_SERVER_ERROR: &str = "Internal server error";
const ITEMS_SOURCE: &str = "postgresql";
const BEARER_PREFIX: &str = "Bearer ";

pub async fn health(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    Json(HealthResponse {
        status: "ok",
        service: state.service_name.clone(),
    })
}

pub async fn items(State(state): State<Arc<AppState>>) -> Response {
    match state.store.list_items().await {
        Ok(rows) => Json(ItemsResponse {
            items: rows
                .into_iter()
                .map(|row| ItemDto {
                    id: row.id,
                    name: row.name,
                    description: row.description,
                })
                .collect(),
            source: ITEMS_SOURCE,
        })
        .into_response(),
        Err(err) => {
            tracing::error!("{}: {err}", state.service_name);
            server_error()
        }
    }
}

pub async fn register(
    State(state): State<Arc<AppState>>,
    body: Result<Json<Credentials>, axum::extract::rejection::JsonRejection>,
) -> Response {
    let creds = match body {
        Ok(Json(creds)) => creds,
        Err(_) => return bad_request(MESSAGE_INVALID_JSON),
    };
    let (username, password) = match creds.validate() {
        Ok(values) => values,
        Err(message) => return bad_request(&message),
    };

    match state.store.find_user_by_username(&username).await {
        Ok(_) => return conflict(MESSAGE_DUPLICATE_USER),
        Err(StoreError::NotFound) => {}
        Err(err) => {
            tracing::error!("{}: {err}", state.service_name);
            return server_error();
        }
    }

    let password_hash = match hash_password(&password) {
        Ok(hash) => hash,
        Err(err) => {
            tracing::error!("{}: {err}", state.service_name);
            return server_error();
        }
    };

    match state.store.create_user(&username, &password_hash).await {
        Ok(_) => issue_token(&state, StatusCode::CREATED, &username),
        Err(StoreError::Duplicate) => conflict(MESSAGE_DUPLICATE_USER),
        Err(err) => {
            tracing::error!("{}: {err}", state.service_name);
            server_error()
        }
    }
}

pub async fn login(
    State(state): State<Arc<AppState>>,
    body: Result<Json<Credentials>, axum::extract::rejection::JsonRejection>,
) -> Response {
    let creds = match body {
        Ok(Json(creds)) => creds,
        Err(_) => return bad_request(MESSAGE_INVALID_JSON),
    };
    let (username, password) = match creds.validate() {
        Ok(values) => values,
        Err(message) => return bad_request(&message),
    };

    let user = match state.store.find_user_by_username(&username).await {
        Ok(user) => user,
        Err(StoreError::NotFound) => return unauthorized_credentials(),
        Err(err) => {
            tracing::error!("{}: {err}", state.service_name);
            return server_error();
        }
    };

    if !check_password(&password, &user.password_hash) {
        return unauthorized_credentials();
    }

    issue_token(&state, StatusCode::OK, &user.username)
}

pub async fn logout() -> StatusCode {
    StatusCode::NO_CONTENT
}

pub async fn me(Extension(username): Extension<String>) -> impl IntoResponse {
    Json(ProfileResponse { username })
}

pub async fn delete_account(
    State(state): State<Arc<AppState>>,
    Extension(username): Extension<String>,
) -> Response {
    if let Err(err) = state.store.delete_user(&username).await {
        tracing::error!("{}: {err}", state.service_name);
        return server_error();
    }
    StatusCode::NO_CONTENT.into_response()
}

pub async fn api_fallback(_request: Request<Body>) -> Response {
    unauthorized()
}

pub async fn require_auth(
    State(state): State<Arc<AppState>>,
    mut request: Request<Body>,
    next: Next,
) -> Response {
    match authenticated_username(&state, request.headers()).await {
        Ok(username) => {
            request.extensions_mut().insert(username);
            next.run(request).await
        }
        Err(response) => response,
    }
}

async fn authenticated_username(
    state: &AppState,
    headers: &HeaderMap,
) -> Result<String, Response> {
    let header = headers
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .unwrap_or_default();
    if !header.starts_with(BEARER_PREFIX) {
        return Err(unauthorized());
    }
    let raw = header.trim_start_matches(BEARER_PREFIX);
    let username = match state.tokens.username(raw) {
        Ok(username) => username,
        Err(_) => return Err(unauthorized()),
    };
    match state.store.find_user_by_username(&username).await {
        Ok(_) => Ok(username),
        Err(StoreError::NotFound) => Err(unauthorized()),
        Err(err) => {
            tracing::error!("{}: {err}", state.service_name);
            Err(server_error())
        }
    }
}

fn issue_token(state: &AppState, status: StatusCode, username: &str) -> Response {
    let token = match state.tokens.create(username) {
        Ok(token) => token,
        Err(err) => {
            tracing::error!("{}: {err}", state.service_name);
            return server_error();
        }
    };
    (
        status,
        Json(AuthResponse {
            token,
            username: username.to_string(),
            redirect_url: POST_AUTH_REDIRECT,
        }),
    )
        .into_response()
}

fn bad_request(message: &str) -> Response {
    (
        StatusCode::BAD_REQUEST,
        Json(ErrorResponse {
            message: message.to_string(),
        }),
    )
        .into_response()
}

fn conflict(message: &str) -> Response {
    (
        StatusCode::CONFLICT,
        Json(ErrorResponse {
            message: message.to_string(),
        }),
    )
        .into_response()
}

fn unauthorized_credentials() -> Response {
    (
        StatusCode::UNAUTHORIZED,
        Json(ErrorResponse {
            message: MESSAGE_BAD_CREDENTIALS.to_string(),
        }),
    )
        .into_response()
}

fn unauthorized() -> Response {
    (
        StatusCode::UNAUTHORIZED,
        Json(ErrorResponse {
            message: MESSAGE_UNAUTHORIZED.to_string(),
        }),
    )
        .into_response()
}

fn server_error() -> Response {
    (
        StatusCode::INTERNAL_SERVER_ERROR,
        Json(ErrorResponse {
            message: MESSAGE_SERVER_ERROR.to_string(),
        }),
    )
        .into_response()
}

#[cfg(test)]
mod tests {
    use std::fs;
    use std::path::PathBuf;
    use std::sync::Arc;
    use std::time::Duration;

    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use http_body_util::BodyExt;
    use tower::ServiceExt;

    use crate::api::test_router;
    use crate::security::{check_password, hash_password, TokenService};
    use crate::store::FakeStore;

    const TEST_SECRET: &str = "multistack-dev-secret-change-in-production-min-32-chars";
    const TEST_USER: &str = "user1";
    const TEST_PASSWORD: &str = "password1";

    struct Harness {
        app: axum::Router,
        store: Arc<FakeStore>,
        tokens: Arc<TokenService>,
    }

    fn new_harness(store: Arc<FakeStore>) -> Harness {
        let tokens = Arc::new(TokenService::new(
            TEST_SECRET.to_string(),
            Duration::from_secs(3600),
        ));
        Harness {
            app: test_router(
                store.clone() as Arc<dyn crate::store::Store>,
                tokens.clone(),
            ),
            store,
            tokens,
        }
    }

    fn seeded_harness() -> Harness {
        let hash = hash_password(TEST_PASSWORD).unwrap();
        new_harness(Arc::new(FakeStore::new().with_user(TEST_USER, &hash)))
    }

    async fn body_string(response: axum::response::Response) -> String {
        let bytes = response.into_body().collect().await.unwrap().to_bytes();
        String::from_utf8(bytes.to_vec()).unwrap()
    }

    async fn do_request(
        harness: &Harness,
        method: &str,
        path: &str,
        body: Option<&str>,
        extra: &[(&str, &str)],
    ) -> axum::response::Response {
        let mut builder = Request::builder()
            .method(method)
            .uri(path)
            .header("content-type", "application/json");
        for (key, value) in extra {
            builder = builder.header(*key, *value);
        }
        let request = builder
            .body(Body::from(body.unwrap_or("").to_string()))
            .unwrap();
        harness.app.clone().oneshot(request).await.unwrap()
    }

    fn bearer(token: &str) -> String {
        format!("Bearer {token}")
    }

    fn contract_paths() -> (PathBuf, PathBuf) {
        let manifest = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        (
            manifest.join("resources/openapi.yaml"),
            manifest.join("../../../_contract/openapi.yaml"),
        )
    }

    fn require_message(body: &str, want: &str) {
        let payload: serde_json::Value = serde_json::from_str(body).unwrap();
        assert_eq!(payload.as_object().unwrap().len(), 1);
        assert_eq!(payload["message"], want);
    }

    #[tokio::test]
    async fn health_matches_contract() {
        let harness = new_harness(Arc::new(FakeStore::new()));
        let response = do_request(&harness, "GET", "/api/health", None, &[]).await;
        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(
            body_string(response).await,
            r#"{"status":"ok","service":"backend-rust-axum"}"#
        );
    }

    #[tokio::test]
    async fn items_lists_seeded_rows() {
        let harness = new_harness(Arc::new(
            FakeStore::new()
                .with_item("Alpha", "First seeded item from PostgreSQL")
                .with_item("Beta", "Second seeded item for demo API"),
        ));
        let response = do_request(&harness, "GET", "/api/items", None, &[]).await;
        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(
            body_string(response).await,
            r#"{"items":[{"id":1,"name":"Alpha","description":"First seeded item from PostgreSQL"},{"id":2,"name":"Beta","description":"Second seeded item for demo API"}],"source":"postgresql"}"#
        );
    }

    #[tokio::test]
    async fn items_empty_is_array_not_null() {
        let harness = new_harness(Arc::new(FakeStore::new()));
        let response = do_request(&harness, "GET", "/api/items", None, &[]).await;
        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(
            body_string(response).await,
            r#"{"items":[],"source":"postgresql"}"#
        );
    }

    #[tokio::test]
    async fn items_database_failure() {
        let store = Arc::new(FakeStore::new());
        store.fail_list_items();
        let harness = new_harness(store);
        let response = do_request(&harness, "GET", "/api/items", None, &[]).await;
        assert_eq!(response.status(), StatusCode::INTERNAL_SERVER_ERROR);
        require_message(&body_string(response).await, "Internal server error");
    }

    #[tokio::test]
    async fn register_creates_user() {
        let harness = new_harness(Arc::new(FakeStore::new()));
        let response = do_request(
            &harness,
            "POST",
            "/api/auth/register",
            Some(r#"{"username":"newbie","password":"password1"}"#),
            &[],
        )
        .await;
        assert_eq!(response.status(), StatusCode::CREATED);
        let payload: serde_json::Value =
            serde_json::from_str(&body_string(response).await).unwrap();
        assert_eq!(payload["username"], "newbie");
        assert_eq!(payload["redirectUrl"], "/");
        let token = payload["token"].as_str().unwrap();
        assert_eq!(harness.tokens.username(token).unwrap(), "newbie");
        let created = &harness.store.users()[0];
        assert_ne!(created.password_hash, "password1");
        assert!(check_password("password1", &created.password_hash));
    }

    #[tokio::test]
    async fn register_duplicate_username() {
        let harness = seeded_harness();
        let response = do_request(
            &harness,
            "POST",
            "/api/auth/register",
            Some(r#"{"username":"user1","password":"password1"}"#),
            &[],
        )
        .await;
        assert_eq!(response.status(), StatusCode::CONFLICT);
        require_message(&body_string(response).await, "Username already taken");
    }

    #[tokio::test]
    async fn register_lost_unique_race() {
        let store = Arc::new(FakeStore::new());
        store.fail_create_user_duplicate();
        let harness = new_harness(store);
        let response = do_request(
            &harness,
            "POST",
            "/api/auth/register",
            Some(r#"{"username":"racer","password":"password1"}"#),
            &[],
        )
        .await;
        assert_eq!(response.status(), StatusCode::CONFLICT);
        require_message(&body_string(response).await, "Username already taken");
    }

    #[tokio::test]
    async fn register_database_failures() {
        let lookup = Arc::new(FakeStore::new());
        lookup.fail_find_user();
        let response = do_request(
            &new_harness(lookup),
            "POST",
            "/api/auth/register",
            Some(r#"{"username":"newbie","password":"password1"}"#),
            &[],
        )
        .await;
        assert_eq!(response.status(), StatusCode::INTERNAL_SERVER_ERROR);
        require_message(&body_string(response).await, "Internal server error");

        let insert = Arc::new(FakeStore::new());
        insert.fail_create_user();
        let response = do_request(
            &new_harness(insert),
            "POST",
            "/api/auth/register",
            Some(r#"{"username":"newbie","password":"password1"}"#),
            &[],
        )
        .await;
        assert_eq!(response.status(), StatusCode::INTERNAL_SERVER_ERROR);
        require_message(&body_string(response).await, "Internal server error");
    }

    #[tokio::test]
    async fn login_succeeds() {
        let harness = seeded_harness();
        let response = do_request(
            &harness,
            "POST",
            "/api/auth/login",
            Some(r#"{"username":"user1","password":"password1"}"#),
            &[],
        )
        .await;
        assert_eq!(response.status(), StatusCode::OK);
        let payload: serde_json::Value =
            serde_json::from_str(&body_string(response).await).unwrap();
        assert_eq!(payload["username"], TEST_USER);
        assert_eq!(payload["redirectUrl"], "/");
        assert!(!payload["token"].as_str().unwrap().is_empty());
    }

    #[tokio::test]
    async fn login_rejects_bad_credentials() {
        let harness = seeded_harness();
        for body in [
            r#"{"username":"user1","password":"wrong-password"}"#,
            r#"{"username":"ghost","password":"password1"}"#,
        ] {
            let response = do_request(&harness, "POST", "/api/auth/login", Some(body), &[]).await;
            assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
            require_message(&body_string(response).await, "Wrong login or password");
        }
    }

    #[tokio::test]
    async fn login_database_failure() {
        let store = Arc::new(FakeStore::new());
        store.fail_find_user();
        let response = do_request(
            &new_harness(store),
            "POST",
            "/api/auth/login",
            Some(r#"{"username":"user1","password":"password1"}"#),
            &[],
        )
        .await;
        assert_eq!(response.status(), StatusCode::INTERNAL_SERVER_ERROR);
        require_message(&body_string(response).await, "Internal server error");
    }

    #[tokio::test]
    async fn credential_validation_rejected_with_400() {
        let harness = seeded_harness();
        let username_too_long = format!(
            r#"{{"username":"{}","password":"password1"}}"#,
            "u".repeat(65)
        );
        let password_too_long = format!(
            r#"{{"username":"user1","password":"{}"}}"#,
            "p".repeat(129)
        );
        let cases = [
            ("{}", "username is required; password is required"),
            (
                r#"{"username":7,"password":"password1"}"#,
                "username is required",
            ),
            (r#"{"username":"user1"}"#, "password is required"),
            (
                r#"{"username":"ab","password":"password1"}"#,
                "username must be 3-64 characters",
            ),
            (username_too_long.as_str(), "username must be 3-64 characters"),
            (
                r#"{"username":"user1","password":"short"}"#,
                "password must be 6-128 characters",
            ),
            (password_too_long.as_str(), "password must be 6-128 characters"),
            (
                r#"{"username":"","password":""}"#,
                "username is required; password is required",
            ),
            (
                r#"{"username":"ab","password":"short"}"#,
                "username must be 3-64 characters; password must be 6-128 characters",
            ),
            (
                r#"{"username":"","password":"short"}"#,
                "username is required; password must be 6-128 characters",
            ),
        ];
        for (body, message) in cases {
            for path in ["/api/auth/register", "/api/auth/login"] {
                let response = do_request(&harness, "POST", path, Some(body), &[]).await;
                assert_eq!(response.status(), StatusCode::BAD_REQUEST);
                require_message(&body_string(response).await, message);
            }
        }
    }

    #[tokio::test]
    async fn invalid_json_body_rejected_with_400() {
        let harness = seeded_harness();
        for body in ["", "not json", "{", "[]", "\"user1\"", "42", "null"] {
            for path in ["/api/auth/register", "/api/auth/login"] {
                let response = do_request(&harness, "POST", path, Some(body), &[]).await;
                assert_eq!(response.status(), StatusCode::BAD_REQUEST);
                require_message(&body_string(response).await, "Request body is not valid JSON");
            }
        }
    }

    #[tokio::test]
    async fn unmapped_api_requests_require_authentication() {
        let harness = seeded_harness();
        let cases = [
            ("GET", "/api/nope"),
            ("GET", "/api/auth/nope"),
            ("GET", "/api/auth/login"),
            ("DELETE", "/api/items"),
        ];
        for (method, path) in cases {
            let response = do_request(&harness, method, path, None, &[]).await;
            assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
            require_message(&body_string(response).await, "Unauthorized");
        }
    }

    #[tokio::test]
    async fn unmapped_path_outside_api_is_not_found() {
        let harness = seeded_harness();
        let response = do_request(&harness, "GET", "/nope", None, &[]).await;
        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn logout_returns_no_content() {
        let harness = seeded_harness();
        let response = do_request(&harness, "POST", "/api/auth/logout", None, &[]).await;
        assert_eq!(response.status(), StatusCode::NO_CONTENT);
        assert!(body_string(response).await.is_empty());
    }

    #[tokio::test]
    async fn me_with_valid_token() {
        let harness = seeded_harness();
        let token = harness.tokens.create(TEST_USER).unwrap();
        let auth = bearer(&token);
        let response = do_request(
            &harness,
            "GET",
            "/api/auth/me",
            None,
            &[("authorization", auth.as_str())],
        )
        .await;
        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(body_string(response).await, r#"{"username":"user1"}"#);
    }

    #[tokio::test]
    async fn me_rejects_bad_tokens() {
        let harness = seeded_harness();
        let valid = harness.tokens.create(TEST_USER).unwrap();
        let expired = TokenService::with_expiration_secs(TEST_SECRET.to_string(), -60)
            .create(TEST_USER)
            .unwrap();
        let foreign = TokenService::new(
            "some-other-secret-long-enough-for-hs256".into(),
            Duration::from_secs(3600),
        )
        .create(TEST_USER)
        .unwrap();
        let ghost = harness.tokens.create("deleted-user").unwrap();
        let cases = [
            ("no header", None),
            ("wrong scheme", Some(format!("Token {valid}"))),
            ("bearer no space", Some(format!("Bearer{valid}"))),
            ("empty token", Some("Bearer ".into())),
            ("garbage token", Some("Bearer not.a.token".into())),
            ("expired token", Some(format!("Bearer {expired}"))),
            ("foreign signature", Some(format!("Bearer {foreign}"))),
            ("deleted user", Some(format!("Bearer {ghost}"))),
        ];
        for (name, header) in &cases {
            let extra: Vec<(&str, &str)> = match header {
                Some(value) => vec![("authorization", value.as_str())],
                None => vec![],
            };
            let response = do_request(&harness, "GET", "/api/auth/me", None, &extra).await;
            assert_eq!(response.status(), StatusCode::UNAUTHORIZED, "{name}");
            require_message(&body_string(response).await, "Unauthorized");
        }
    }

    #[tokio::test]
    async fn me_database_failure() {
        let harness = seeded_harness();
        let token = harness.tokens.create(TEST_USER).unwrap();
        harness.store.fail_find_user();
        let auth = bearer(&token);
        let response = do_request(
            &harness,
            "GET",
            "/api/auth/me",
            None,
            &[("authorization", auth.as_str())],
        )
        .await;
        assert_eq!(response.status(), StatusCode::INTERNAL_SERVER_ERROR);
        require_message(&body_string(response).await, "Internal server error");
    }

    #[tokio::test]
    async fn delete_account_removes_user() {
        let harness = seeded_harness();
        let token = harness.tokens.create(TEST_USER).unwrap();
        let auth = bearer(&token);
        let response = do_request(
            &harness,
            "DELETE",
            "/api/auth/me",
            None,
            &[("authorization", auth.as_str())],
        )
        .await;
        assert_eq!(response.status(), StatusCode::NO_CONTENT);
        assert!(body_string(response).await.is_empty());
        assert!(harness.store.users().is_empty());
        let profile = do_request(
            &harness,
            "GET",
            "/api/auth/me",
            None,
            &[("authorization", auth.as_str())],
        )
        .await;
        assert_eq!(profile.status(), StatusCode::UNAUTHORIZED);
    }

    #[tokio::test]
    async fn delete_account_without_token() {
        let harness = seeded_harness();
        let response = do_request(&harness, "DELETE", "/api/auth/me", None, &[]).await;
        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
        require_message(&body_string(response).await, "Unauthorized");
        assert_eq!(harness.store.users().len(), 1);
    }

    #[tokio::test]
    async fn delete_account_database_failure() {
        let harness = seeded_harness();
        let token = harness.tokens.create(TEST_USER).unwrap();
        harness.store.fail_delete_user();
        let auth = bearer(&token);
        let response = do_request(
            &harness,
            "DELETE",
            "/api/auth/me",
            None,
            &[("authorization", auth.as_str())],
        )
        .await;
        assert_eq!(response.status(), StatusCode::INTERNAL_SERVER_ERROR);
        require_message(&body_string(response).await, "Internal server error");
    }

    #[tokio::test]
    async fn login_after_delete_is_rejected() {
        let harness = new_harness(Arc::new(FakeStore::new()));
        let registered = do_request(
            &harness,
            "POST",
            "/api/auth/register",
            Some(r#"{"username":"gonesoon","password":"password1"}"#),
            &[],
        )
        .await;
        assert_eq!(registered.status(), StatusCode::CREATED);
        let token = serde_json::from_str::<serde_json::Value>(&body_string(registered).await)
            .unwrap()["token"]
            .as_str()
            .unwrap()
            .to_string();
        let auth = bearer(&token);
        let deleted = do_request(
            &harness,
            "DELETE",
            "/api/auth/me",
            None,
            &[("authorization", auth.as_str())],
        )
        .await;
        assert_eq!(deleted.status(), StatusCode::NO_CONTENT);
        let logged_in = do_request(
            &harness,
            "POST",
            "/api/auth/login",
            Some(r#"{"username":"gonesoon","password":"password1"}"#),
            &[],
        )
        .await;
        assert_eq!(logged_in.status(), StatusCode::UNAUTHORIZED);
        require_message(&body_string(logged_in).await, "Wrong login or password");
    }

    #[tokio::test]
    async fn maximum_length_password_round_trips() {
        let password = "x".repeat(128);
        let harness = new_harness(Arc::new(FakeStore::new()));
        let body = format!(r#"{{"username":"longpass","password":"{password}"}}"#);
        let registered = do_request(
            &harness,
            "POST",
            "/api/auth/register",
            Some(&body),
            &[],
        )
        .await;
        assert_eq!(registered.status(), StatusCode::CREATED);
        let logged_in = do_request(&harness, "POST", "/api/auth/login", Some(&body), &[]).await;
        assert_eq!(logged_in.status(), StatusCode::OK);
        let token = serde_json::from_str::<serde_json::Value>(&body_string(logged_in).await)
            .unwrap()["token"]
            .as_str()
            .unwrap()
            .to_string();
        let auth = bearer(&token);
        let profile = do_request(
            &harness,
            "GET",
            "/api/auth/me",
            None,
            &[("authorization", auth.as_str())],
        )
        .await;
        assert_eq!(profile.status(), StatusCode::OK);
        assert_eq!(body_string(profile).await, r#"{"username":"longpass"}"#);
    }

    #[tokio::test]
    async fn register_then_login_then_me() {
        let harness = new_harness(Arc::new(FakeStore::new()));
        let registered = do_request(
            &harness,
            "POST",
            "/api/auth/register",
            Some(r#"{"username":"fresh","password":"password1"}"#),
            &[],
        )
        .await;
        assert_eq!(registered.status(), StatusCode::CREATED);
        let logged_in = do_request(
            &harness,
            "POST",
            "/api/auth/login",
            Some(r#"{"username":"fresh","password":"password1"}"#),
            &[],
        )
        .await;
        assert_eq!(logged_in.status(), StatusCode::OK);
        let token = serde_json::from_str::<serde_json::Value>(&body_string(logged_in).await)
            .unwrap()["token"]
            .as_str()
            .unwrap()
            .to_string();
        let auth = bearer(&token);
        let profile = do_request(
            &harness,
            "GET",
            "/api/auth/me",
            None,
            &[("authorization", auth.as_str())],
        )
        .await;
        assert_eq!(profile.status(), StatusCode::OK);
        assert_eq!(body_string(profile).await, r#"{"username":"fresh"}"#);
    }

    #[tokio::test]
    async fn cors_preflight() {
        let harness = seeded_harness();
        let response = do_request(
            &harness,
            "OPTIONS",
            "/api/auth/login",
            None,
            &[
                ("origin", "https://autotests.ai"),
                ("access-control-request-method", "POST"),
                ("access-control-request-headers", "authorization,content-type"),
            ],
        )
        .await;
        assert_eq!(response.status(), StatusCode::NO_CONTENT);
        let headers = response.headers();
        assert_eq!(headers.get("access-control-allow-origin").unwrap(), "*");
        assert_eq!(
            headers.get("access-control-allow-methods").unwrap(),
            "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        );
        assert_eq!(
            headers.get("access-control-allow-headers").unwrap(),
            "authorization,content-type"
        );
        assert_eq!(
            headers.get("access-control-expose-headers").unwrap(),
            "Authorization"
        );
        assert!(headers.get("access-control-allow-credentials").is_none());
    }

    #[tokio::test]
    async fn cors_on_simple_request() {
        let harness = seeded_harness();
        let response = do_request(
            &harness,
            "GET",
            "/api/health",
            None,
            &[("origin", "https://autotests.ai")],
        )
        .await;
        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(
            response.headers().get("access-control-allow-origin").unwrap(),
            "*"
        );
        assert_eq!(
            response.headers().get("access-control-allow-headers").unwrap(),
            "*"
        );
    }

    #[tokio::test]
    async fn openapi_spec_matches_contract_copy() {
        let (copy, ssot) = contract_paths();
        let expected = fs::read(&copy).unwrap();
        let contract = fs::read(&ssot).unwrap();
        assert_eq!(expected, contract);

        let harness = new_harness(Arc::new(FakeStore::new()));
        let response = do_request(&harness, "GET", "/api/openapi.yaml", None, &[]).await;
        assert_eq!(response.status(), StatusCode::OK);
        assert!(
            response
                .headers()
                .get("content-type")
                .and_then(|value| value.to_str().ok())
                .unwrap_or_default()
                .contains("application/yaml")
        );
        assert_eq!(
            body_string(response).await,
            String::from_utf8(expected).unwrap()
        );
    }

    #[tokio::test]
    async fn openapi_docs_serves_swagger_ui() {
        let harness = new_harness(Arc::new(FakeStore::new()));
        let response = do_request(&harness, "GET", "/api/docs", None, &[]).await;
        assert_eq!(response.status(), StatusCode::OK);
        assert!(
            response
                .headers()
                .get("content-type")
                .and_then(|value| value.to_str().ok())
                .unwrap_or_default()
                .contains("text/html")
        );
        let body = body_string(response).await;
        assert!(body.contains("SwaggerUIBundle"));
        assert!(body.contains("./openapi.yaml"));
    }
}
