use allure_cargotest::allure_test;
use reqwest::Method;
use tests_rust_testing_reqwest as tests;

#[allure_test(name = "GET /api/health matches the health contract and reports ok")]
#[tokio::test]
async fn health_matches_contract() {
    tests::layer_api("Health and items API", "Home", "Health and items", "normal");
    let res = tests::request(allure.clone(), Method::GET, "/api/health", tests::RequestOpt::default())
        .await;
    assert_eq!(res.status, 200);
    tests::assert_schema(&res.raw, "health.json");
    assert_eq!(res.map().get("status").and_then(|v| v.as_str()), Some("ok"));
}

#[allure_test(name = "GET /api/items matches the items contract (typed rows, named source)")]
#[tokio::test]
async fn items_match_contract() {
    tests::layer_api("Health and items API", "Home", "Health and items", "normal");
    let res = tests::request(allure.clone(), Method::GET, "/api/items", tests::RequestOpt::default())
        .await;
    assert_eq!(res.status, 200);
    tests::assert_schema(&res.raw, "items.json");
}
