use allure_cargotest::allure_test;
use tests_rust_testing_selenium as tests;

fn layer() {
    tests::layer_ui("Home error states (mock)", "Home", "Error states", "normal");
    allure_rust_commons::tag("mock");
    allure_rust_commons::tag("negative");
}

#[allure_test(name = "Items API failure shows a readable error, not a blank page")]
#[tokio::test]
async fn items_api_failure_shows_readable_error() {
    layer();
    if !tests::mock_available().await {
        eprintln!(
            "WireMock admin API is not exposed on this stand — error injection needs the mock profile"
        );
        return;
    }
    tests::mock_set_state("items", "error").await;
    tests::with_browser(|| async {
        tests::HomePage::default()
            .open_page()
            .await
            .should_show_items_error("✗ items: HTTP 500")
            .await;
    })
    .await;
    tests::mock_reset_all().await;
}

#[allure_test(name = "Health API failure shows a readable error in the health panel")]
#[tokio::test]
async fn health_api_failure_shows_readable_error() {
    layer();
    if !tests::mock_available().await {
        eprintln!(
            "WireMock admin API is not exposed on this stand — error injection needs the mock profile"
        );
        return;
    }
    tests::mock_set_state("health", "error").await;
    tests::with_browser(|| async {
        tests::HomePage::default()
            .open_page()
            .await
            .should_show_health_error("✗ health: HTTP 500")
            .await;
    })
    .await;
    tests::mock_reset_all().await;
}
