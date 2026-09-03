use allure_cargotest::allure_test;
use reqwest::Method;
use serde_json::json;
use tests_rust_testing_reqwest as tests;

#[allure_test(name = "register → login → me → logout (stateless: token survives) → delete → me is 401")]
#[tokio::test]
async fn account_lifecycle_round_trip() {
    tests::layer_api(
        "Auth account lifecycle on deployed stand",
        "Authentication",
        "Account lifecycle",
        "critical",
    );
    let name = tests::username();
    let password = "password123";

    let created = tests::request(
        allure.clone(),
        Method::POST,
        "/api/auth/register",
        tests::RequestOpt {
            json: Some(json!({"username": name, "password": password})),
            ..Default::default()
        },
    )
    .await;
    assert_eq!(created.status, 201);
    assert_eq!(
        created.map().get("username").and_then(|v| v.as_str()),
        Some(name.as_str())
    );

    let logged_in = tests::request(
        allure.clone(),
        Method::POST,
        "/api/auth/login",
        tests::RequestOpt {
            json: Some(json!({"username": name, "password": password})),
            ..Default::default()
        },
    )
    .await;
    assert_eq!(logged_in.status, 200);
    let token = logged_in
        .map()
        .get("token")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    assert!(!token.is_empty());

    let me = tests::request(
        allure.clone(),
        Method::GET,
        "/api/auth/me",
        tests::RequestOpt {
            token: Some(token.clone()),
            ..Default::default()
        },
    )
    .await;
    assert_eq!(me.status, 200);
    assert_eq!(me.map().get("username").and_then(|v| v.as_str()), Some(name.as_str()));

    let logout = tests::request(
        allure.clone(),
        Method::POST,
        "/api/auth/logout",
        tests::RequestOpt {
            token: Some(token.clone()),
            ..Default::default()
        },
    )
    .await;
    assert_eq!(logout.status, 204);

    let still_me = tests::request(
        allure.clone(),
        Method::GET,
        "/api/auth/me",
        tests::RequestOpt {
            token: Some(token.clone()),
            ..Default::default()
        },
    )
    .await;
    assert_eq!(still_me.status, 200);
    assert_eq!(
        still_me.map().get("username").and_then(|v| v.as_str()),
        Some(name.as_str())
    );

    let deleted = tests::request(
        allure.clone(),
        Method::DELETE,
        "/api/auth/me",
        tests::RequestOpt {
            token: Some(token.clone()),
            ..Default::default()
        },
    )
    .await;
    assert_eq!(deleted.status, 204);

    let gone = tests::request(
        allure.clone(),
        Method::GET,
        "/api/auth/me",
        tests::RequestOpt {
            token: Some(token),
            ..Default::default()
        },
    )
    .await;
    assert_eq!(gone.status, 401);
}
