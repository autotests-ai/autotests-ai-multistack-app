use allure_cargotest::allure_test;
use tests_rust_testing_selenium as tests;

#[allure_test(name = "Page load fetches health and items from API")]
#[tokio::test]
async fn page_load_fetches_items() {
    tests::layer_e2e("Home", "Home", "Home load", "normal");
    allure_rust_commons::tag("smoke");
    tests::with_browser(|| async {
        let service = tests::load_config().api_health_service;
        tests::HomePage::default()
            .open_page()
            .await
            .should_show_health_text(&format!("service: {service}"))
            .await
            .should_show_item_text("Alpha")
            .await;
    })
    .await;
}
