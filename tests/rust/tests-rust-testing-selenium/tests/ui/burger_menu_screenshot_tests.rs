use allure_cargotest::allure_test;
use tests_rust_testing_selenium as tests;

const VIEWPORT_HEIGHT: i32 = 900;

fn layer() {
    tests::layer_ui("Burger menu", "Header", "Burger menu", "minor");
    allure_rust_commons::sub_suite("screenshot");
    allure_rust_commons::tag("screenshot");
}

async fn open_menu_matches_screenshot(viewport_width: i32) {
    layer();
    tests::with_browser(|| async move {
        tests::set_viewport(viewport_width, VIEWPORT_HEIGHT).await;
        tests::LoginPage::default()
            .open_page()
            .await
            .header
            .open_menu()
            .await;
        let panel = tests::LoginPage::default().header.menu_panel().await;
        tests::capture_and_compare(
            &panel,
            "burger-menu",
            viewport_width,
            &format!("burger-menu-{viewport_width}"),
        )
        .await;
        tests::reset_viewport().await;
    })
    .await;
}

#[allure_test(name = "Open burger menu matches screenshot")]
#[tokio::test]
async fn open_menu_matches_screenshot_390() {
    open_menu_matches_screenshot(390).await;
}

#[allure_test(name = "Open burger menu matches screenshot")]
#[tokio::test]
async fn open_menu_matches_screenshot_768() {
    open_menu_matches_screenshot(768).await;
}
