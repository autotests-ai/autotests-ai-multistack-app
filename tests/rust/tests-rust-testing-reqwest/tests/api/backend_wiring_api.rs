use allure_cargotest::allure_test;
use reqwest::Method;
use tests_rust_testing_reqwest as tests;

#[allure_test(name = "GET /api/health — deployed service is the active backend module, not a neighbour")]
#[tokio::test]
async fn health_reports_active_backend_service() {
    tests::layer_api(
        "Backend wiring on deployed stand",
        "Wired backend",
        "Health and data source",
        "blocker",
    );
    allure_rust_commons::tag("smoke");
    let res = tests::request(allure.clone(), Method::GET, "/api/health", tests::RequestOpt::default())
        .await;
    assert_eq!(res.status, 200);
    assert_eq!(
        res.map().get("service").and_then(|v| v.as_str()),
        Some(tests::load_config().api_health_service.as_str())
    );
}

#[allure_test(name = "GET /api/items — catalogue is served from PostgreSQL, not a stub or fallback")]
#[tokio::test]
async fn items_are_wired_to_postgresql() {
    tests::layer_api(
        "Backend wiring on deployed stand",
        "Wired backend",
        "Health and data source",
        "blocker",
    );
    let res = tests::request(allure.clone(), Method::GET, "/api/items", tests::RequestOpt::default())
        .await;
    assert_eq!(res.status, 200);
    assert_eq!(res.map().get("source").and_then(|v| v.as_str()), Some("postgresql"));
}
