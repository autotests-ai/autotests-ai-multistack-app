use allure_cargotest::allure_test;
use tests_rust_testing_selenium as tests;

const VIEWPORT_WIDTH: i32 = 1280;
const VIEWPORT_HEIGHT: i32 = 900;

#[allure_test(name = "Home layout matches screenshot at 1280px")]
#[tokio::test]
async fn home_layout_matches_screenshot() {
    tests::layer_ui("Home layout screenshot", "Home", "Home layout", "minor");
    allure_rust_commons::tag("screenshot");
    tests::with_browser(|| async {
        tests::set_viewport(VIEWPORT_WIDTH, VIEWPORT_HEIGHT).await;
        tests::HomePage::default()
            .open_page()
            .await
            .should_show_layout_and_health()
            .await;
        let panel = tests::HomePage::default().layout_panel().await;
        tests::capture_and_compare(
            &panel,
            "home-layout",
            VIEWPORT_WIDTH,
            &format!("home-layout-{VIEWPORT_WIDTH}"),
        )
        .await;
    })
    .await;
}
