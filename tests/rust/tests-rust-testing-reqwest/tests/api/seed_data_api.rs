use allure_cargotest::allure_test;
use reqwest::Method;
use tests_rust_testing_reqwest as tests;

#[allure_test(name = "Flyway seed items Alpha, Beta, Gamma are present in PostgreSQL")]
#[tokio::test]
async fn seeded_items_are_ready_after_deploy() {
    tests::layer_api(
        "Seed data on deployed stand",
        "Deploy readiness",
        "Seed data",
        "critical",
    );
    allure_rust_commons::tag("smoke");
    let res = tests::request(allure.clone(), Method::GET, "/api/items", tests::RequestOpt::default())
        .await;
    assert_eq!(res.status, 200);
    let body = res.map();
    assert_eq!(body.get("source").and_then(|v| v.as_str()), Some("postgresql"));
    let names = tests::item_names(&body);
    for expected in ["Alpha", "Beta", "Gamma"] {
        assert!(names.iter().any(|n| n == expected), "missing {expected} in {names:?}");
    }
}
