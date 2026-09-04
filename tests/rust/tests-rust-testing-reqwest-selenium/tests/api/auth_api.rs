use allure_cargotest::allure_test;
use reqwest::Method;
use serde_json::json;
use tests_rust_testing_reqwest_selenium as tests;

#[allure_test(name = "POST /api/auth/login returns the auth contract for a seeded user")]
#[tokio::test]
async fn login_with_valid_credentials() {
    tests::layer_api("Auth API", "Authentication", "Authentication", "critical");
    allure_rust_commons::tag("smoke");
    let res = tests::request(
        allure.clone(),
        Method::POST,
        "/api/auth/login",
        tests::RequestOpt {
            json: Some(json!({"username": "user1", "password": "password1"})),
            ..Default::default()
        },
    )
    .await;
    assert_eq!(res.status, 200);
    tests::assert_schema(&res.raw, "auth-response.json");
    let body = res.map();
    assert_eq!(body.get("username").and_then(|v| v.as_str()), Some("user1"));
    assert_eq!(body.get("redirectUrl").and_then(|v| v.as_str()), Some("/"));
}

#[allure_test(name = "POST /api/auth/login rejects a wrong password with 401")]
#[tokio::test]
async fn login_with_invalid_password() {
    tests::layer_api("Auth API", "Authentication", "Authentication", "critical");
    let res = tests::request(
        allure.clone(),
        Method::POST,
        "/api/auth/login",
        tests::RequestOpt {
            json: Some(json!({"username": "user1", "password": "wrongpassword"})),
            ..Default::default()
        },
    )
    .await;
    assert_eq!(res.status, 401);
    tests::assert_schema(&res.raw, "error.json");
    assert_eq!(tests::message(&res.map()), tests::WRONG_CREDENTIALS_MESSAGE);
}

#[allure_test(name = "POST /api/auth/login answers an unknown user with the same 401 (no enumeration)")]
#[tokio::test]
async fn login_with_unknown_username() {
    tests::layer_api("Auth API", "Authentication", "Authentication", "critical");
    let res = tests::request(
        allure.clone(),
        Method::POST,
        "/api/auth/login",
        tests::RequestOpt {
            json: Some(json!({"username": tests::username(), "password": "password123"})),
            ..Default::default()
        },
    )
    .await;
    assert_eq!(res.status, 401);
    assert_eq!(tests::message(&res.map()), tests::WRONG_CREDENTIALS_MESSAGE);
}

#[allure_test(name = "POST /api/auth/login joins both field errors into one 400 message")]
#[tokio::test]
async fn login_rejects_empty_credentials() {
    tests::layer_api("Auth API", "Authentication", "Authentication", "critical");
    let res = tests::request(
        allure.clone(),
        Method::POST,
        "/api/auth/login",
        tests::RequestOpt {
            json: Some(json!({"username": "", "password": ""})),
            ..Default::default()
        },
    )
    .await;
    assert_eq!(res.status, 400);
    tests::assert_schema(&res.raw, "error.json");
    let message = tests::message(&res.map());
    assert!(message.contains("username"), "{message}");
    assert!(message.contains("password"), "{message}");
    assert!(message.contains("; "), "{message}");
}

#[allure_test(name = "POST /api/auth/login rejects a short username with 400")]
#[tokio::test]
async fn login_rejects_short_username() {
    tests::layer_api("Auth API", "Authentication", "Authentication", "critical");
    allure_rust_commons::tag("negative");
    let res = tests::request(
        allure.clone(),
        Method::POST,
        "/api/auth/login",
        tests::RequestOpt {
            json: Some(json!({"username": "ab", "password": "password1"})),
            ..Default::default()
        },
    )
    .await;
    assert_eq!(res.status, 400);
    tests::assert_schema(&res.raw, "error.json");
    assert!(tests::message(&res.map()).contains("username"));
}

#[allure_test(name = "POST /api/auth/login rejects a short password with 400")]
#[tokio::test]
async fn login_rejects_short_password() {
    tests::layer_api("Auth API", "Authentication", "Authentication", "critical");
    allure_rust_commons::tag("negative");
    let res = tests::request(
        allure.clone(),
        Method::POST,
        "/api/auth/login",
        tests::RequestOpt {
            json: Some(json!({"username": "user1", "password": "123"})),
            ..Default::default()
        },
    )
    .await;
    assert_eq!(res.status, 400);
    tests::assert_schema(&res.raw, "error.json");
    assert!(tests::message(&res.map()).contains("password"));
}

#[allure_test(name = "POST /api/auth/login rejects an empty username with 400")]
#[tokio::test]
async fn login_rejects_empty_username() {
    tests::layer_api("Auth API", "Authentication", "Authentication", "critical");
    allure_rust_commons::tag("negative");
    let res = tests::request(
        allure.clone(),
        Method::POST,
        "/api/auth/login",
        tests::RequestOpt {
            json: Some(json!({"username": "", "password": "password1"})),
            ..Default::default()
        },
    )
    .await;
    assert_eq!(res.status, 400);
    tests::assert_schema(&res.raw, "error.json");
    assert!(tests::message(&res.map()).contains("username"));
}

#[allure_test(name = "POST /api/auth/login rejects an empty password with 400")]
#[tokio::test]
async fn login_rejects_empty_password() {
    tests::layer_api("Auth API", "Authentication", "Authentication", "critical");
    allure_rust_commons::tag("negative");
    let res = tests::request(
        allure.clone(),
        Method::POST,
        "/api/auth/login",
        tests::RequestOpt {
            json: Some(json!({"username": "user1", "password": ""})),
            ..Default::default()
        },
    )
    .await;
    assert_eq!(res.status, 400);
    tests::assert_schema(&res.raw, "error.json");
    assert!(tests::message(&res.map()).contains("password"));
}

#[allure_test(name = "POST /api/auth/login answers a malformed JSON body with 400, not 401")]
#[tokio::test]
async fn login_rejects_malformed_json() {
    tests::layer_api("Auth API", "Authentication", "Authentication", "critical");
    allure_rust_commons::tag("negative");
    let res = tests::request(
        allure.clone(),
        Method::POST,
        "/api/auth/login",
        tests::RequestOpt {
            raw: Some("not json".into()),
            ..Default::default()
        },
    )
    .await;
    assert_eq!(res.status, 400);
    assert_eq!(tests::message(&res.map()), "Request body is not valid JSON");
}

#[allure_test(name = "POST /api/auth/register creates a user, returns the auth contract, and cleans up")]
#[tokio::test]
async fn register_new_user() {
    tests::layer_api("Auth API", "Authentication", "Authentication", "critical");
    let name = tests::username();
    let res = tests::request(
        allure.clone(),
        Method::POST,
        "/api/auth/register",
        tests::RequestOpt {
            json: Some(json!({"username": name, "password": "password123"})),
            ..Default::default()
        },
    )
    .await;
    assert_eq!(res.status, 201);
    tests::assert_schema(&res.raw, "auth-response.json");
    let body = res.map();
    assert_eq!(body.get("username").and_then(|v| v.as_str()), Some(name.as_str()));
    assert_eq!(body.get("redirectUrl").and_then(|v| v.as_str()), Some("/"));
    let token = body.get("token").and_then(|v| v.as_str()).unwrap_or("");
    tests::delete_account(allure.clone(), token).await;
}

#[allure_test(name = "POST /api/auth/register accepts a 3-character username and 6-character password")]
#[tokio::test]
async fn register_accepts_minimum_length_credentials() {
    tests::layer_api("Auth API", "Authentication", "Authentication", "critical");
    let name = tests::username_at_min_length();
    let res = tests::request(
        allure.clone(),
        Method::POST,
        "/api/auth/register",
        tests::RequestOpt {
            json: Some(json!({"username": name, "password": tests::password_at_min_length()})),
            ..Default::default()
        },
    )
    .await;
    assert_eq!(res.status, 201);
    tests::assert_schema(&res.raw, "auth-response.json");
    let body = res.map();
    assert_eq!(body.get("username").and_then(|v| v.as_str()), Some(name.as_str()));
    let token = body.get("token").and_then(|v| v.as_str()).unwrap_or("");
    tests::delete_account(allure.clone(), token).await;
}

#[allure_test(name = "POST /api/auth/login with min-length unknown user is 401, not 400")]
#[tokio::test]
async fn login_min_length_unknown_user_is_unauthorized() {
    tests::layer_api("Auth API", "Authentication", "Authentication", "critical");
    let res = tests::request(
        allure.clone(),
        Method::POST,
        "/api/auth/login",
        tests::RequestOpt {
            json: Some(json!({
                "username": tests::username_at_min_length(),
                "password": tests::password_at_min_length()
            })),
            ..Default::default()
        },
    )
    .await;
    assert_eq!(res.status, 401);
    tests::assert_schema(&res.raw, "error.json");
    assert_eq!(tests::message(&res.map()), tests::WRONG_CREDENTIALS_MESSAGE);
}

#[allure_test(name = "POST /api/auth/register rejects a duplicate username with 409")]
#[tokio::test]
async fn register_duplicate_username() {
    tests::layer_api("Auth API", "Authentication", "Authentication", "critical");
    let res = tests::request(
        allure.clone(),
        Method::POST,
        "/api/auth/register",
        tests::RequestOpt {
            json: Some(json!({"username": "user1", "password": "password123"})),
            ..Default::default()
        },
    )
    .await;
    assert_eq!(res.status, 409);
    tests::assert_schema(&res.raw, "error.json");
    assert_eq!(tests::message(&res.map()), "Username already taken");
}

#[allure_test(name = "POST /api/auth/register rejects a short password with 400")]
#[tokio::test]
async fn register_rejects_short_password() {
    tests::layer_api("Auth API", "Authentication", "Authentication", "critical");
    let res = tests::request(
        allure.clone(),
        Method::POST,
        "/api/auth/register",
        tests::RequestOpt {
            json: Some(json!({"username": "shortuser", "password": "abc"})),
            ..Default::default()
        },
    )
    .await;
    assert_eq!(res.status, 400);
    tests::assert_schema(&res.raw, "error.json");
    assert!(tests::message(&res.map()).contains("password"));
}

#[allure_test(name = "POST /api/auth/register rejects a short username with 400")]
#[tokio::test]
async fn register_rejects_short_username() {
    tests::layer_api("Auth API", "Authentication", "Authentication", "critical");
    let res = tests::request(
        allure.clone(),
        Method::POST,
        "/api/auth/register",
        tests::RequestOpt {
            json: Some(json!({"username": "ab", "password": "password123"})),
            ..Default::default()
        },
    )
    .await;
    assert_eq!(res.status, 400);
    tests::assert_schema(&res.raw, "error.json");
    assert!(tests::message(&res.map()).contains("username"));
}

#[allure_test(name = "POST /api/auth/register rejects an empty username with 400")]
#[tokio::test]
async fn register_rejects_empty_username() {
    tests::layer_api("Auth API", "Authentication", "Authentication", "critical");
    let res = tests::request(
        allure.clone(),
        Method::POST,
        "/api/auth/register",
        tests::RequestOpt {
            json: Some(json!({"username": "", "password": "password123"})),
            ..Default::default()
        },
    )
    .await;
    assert_eq!(res.status, 400);
    tests::assert_schema(&res.raw, "error.json");
    assert!(tests::message(&res.map()).contains("username"));
}

#[allure_test(name = "POST /api/auth/register rejects an empty password with 400")]
#[tokio::test]
async fn register_rejects_empty_password() {
    tests::layer_api("Auth API", "Authentication", "Authentication", "critical");
    let res = tests::request(
        allure.clone(),
        Method::POST,
        "/api/auth/register",
        tests::RequestOpt {
            json: Some(json!({"username": "newuser", "password": ""})),
            ..Default::default()
        },
    )
    .await;
    assert_eq!(res.status, 400);
    tests::assert_schema(&res.raw, "error.json");
    assert!(tests::message(&res.map()).contains("password"));
}

#[allure_test(name = "POST /api/auth/register joins both field errors into one 400 message")]
#[tokio::test]
async fn register_rejects_empty_credentials() {
    tests::layer_api("Auth API", "Authentication", "Authentication", "critical");
    let res = tests::request(
        allure.clone(),
        Method::POST,
        "/api/auth/register",
        tests::RequestOpt {
            json: Some(json!({"username": "", "password": ""})),
            ..Default::default()
        },
    )
    .await;
    assert_eq!(res.status, 400);
    tests::assert_schema(&res.raw, "error.json");
    let message = tests::message(&res.map());
    assert!(message.contains("username"), "{message}");
    assert!(message.contains("password"), "{message}");
}

#[allure_test(name = "POST /api/auth/register answers a malformed JSON body with 400, not 401")]
#[tokio::test]
async fn register_rejects_malformed_json() {
    tests::layer_api("Auth API", "Authentication", "Authentication", "critical");
    let res = tests::request(
        allure.clone(),
        Method::POST,
        "/api/auth/register",
        tests::RequestOpt {
            raw: Some("not json".into()),
            ..Default::default()
        },
    )
    .await;
    assert_eq!(res.status, 400);
    assert_eq!(tests::message(&res.map()), "Request body is not valid JSON");
}

#[allure_test(name = "GET /api/auth/me returns the profile contract for a bearer token")]
#[tokio::test]
async fn profile_with_bearer_token() {
    tests::layer_api("Auth API", "Authentication", "Authentication", "critical");
    let token = tests::login(allure.clone(), "user1", "password1").await;
    let res = tests::request(
        allure.clone(),
        Method::GET,
        "/api/auth/me",
        tests::RequestOpt {
            token: Some(token),
            ..Default::default()
        },
    )
    .await;
    assert_eq!(res.status, 200);
    tests::assert_schema(&res.raw, "profile.json");
    assert_eq!(res.map().get("username").and_then(|v| v.as_str()), Some("user1"));
}

#[allure_test(name = "GET /api/auth/me without a token returns 401")]
#[tokio::test]
async fn profile_without_token() {
    tests::layer_api("Auth API", "Authentication", "Authentication", "critical");
    let res = tests::request(allure.clone(), Method::GET, "/api/auth/me", tests::RequestOpt::default())
        .await;
    assert_eq!(res.status, 401);
}

#[allure_test(name = "GET /api/auth/me with a garbage token returns 401")]
#[tokio::test]
async fn profile_with_garbage_token() {
    tests::layer_api("Auth API", "Authentication", "Authentication", "critical");
    let res = tests::request(
        allure.clone(),
        Method::GET,
        "/api/auth/me",
        tests::RequestOpt {
            token: Some("not-a-jwt".into()),
            ..Default::default()
        },
    )
    .await;
    assert_eq!(res.status, 401);
}

#[allure_test(name = "POST /api/auth/logout returns 204")]
#[tokio::test]
async fn logout_returns_no_content() {
    tests::layer_api("Auth API", "Authentication", "Authentication", "critical");
    let res = tests::request(
        allure.clone(),
        Method::POST,
        "/api/auth/logout",
        tests::RequestOpt::default(),
    )
    .await;
    assert_eq!(res.status, 204);
}

#[allure_test(name = "DELETE /api/auth/me without a token returns 401")]
#[tokio::test]
async fn delete_without_token() {
    tests::layer_api("Auth API", "Authentication", "Authentication", "critical");
    allure_rust_commons::tag("negative");
    let res = tests::request(
        allure.clone(),
        Method::DELETE,
        "/api/auth/me",
        tests::RequestOpt::default(),
    )
    .await;
    assert_eq!(res.status, 401);
}

#[allure_test(name = "DELETE /api/auth/me with a garbage token returns 401")]
#[tokio::test]
async fn delete_with_garbage_token() {
    tests::layer_api("Auth API", "Authentication", "Authentication", "critical");
    allure_rust_commons::tag("negative");
    let res = tests::request(
        allure.clone(),
        Method::DELETE,
        "/api/auth/me",
        tests::RequestOpt {
            token: Some("not-a-jwt".into()),
            ..Default::default()
        },
    )
    .await;
    assert_eq!(res.status, 401);
}

#[allure_test(name = "DELETE /api/auth/me removes the account: repeated login is rejected")]
#[tokio::test]
async fn delete_removes_account() {
    tests::layer_api("Auth API", "Authentication", "Authentication", "critical");
    let name = tests::username();
    let token = tests::register(allure.clone(), &name, "password123").await;
    tests::delete_account(allure.clone(), &token).await;
    let res = tests::request(
        allure.clone(),
        Method::POST,
        "/api/auth/login",
        tests::RequestOpt {
            json: Some(json!({"username": name, "password": "password123"})),
            ..Default::default()
        },
    )
    .await;
    assert_eq!(res.status, 401);
    assert_eq!(tests::message(&res.map()), tests::WRONG_CREDENTIALS_MESSAGE);
}

#[allure_test(name = "unmapped /api/* path requires authentication (security catch-all)")]
#[tokio::test]
async fn unmapped_api_path_requires_authentication() {
    tests::layer_api("Auth API", "Authentication", "Authentication", "critical");
    let res = tests::request(allure.clone(), Method::GET, "/api/nope", tests::RequestOpt::default())
        .await;
    assert_eq!(res.status, 401);
}
