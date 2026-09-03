use allure_cargotest::allure_test;
use tests_rust_testing_reqwest_selenium as tests;

const VIEWPORT_HEIGHT: i32 = 900;

fn layer() {
    tests::layer_ui("Header", "Header", "Header", "minor");
    allure_rust_commons::sub_suite("screenshot");
    allure_rust_commons::tag("screenshot");
}

async fn header_bar_matches_screenshot(viewport_width: i32) {
    layer();
    tests::with_browser(|| async move {
        tests::set_viewport(viewport_width, VIEWPORT_HEIGHT).await;
        tests::LoginPage::default()
            .open_page()
            .await
            .header
            .should_show_embedded_header()
            .await;
        let panel = tests::LoginPage::default().header.header_panel().await;
        tests::capture_and_compare(
            &panel,
            "header",
            viewport_width,
            &format!("header-{viewport_width}"),
        )
        .await;
        tests::reset_viewport().await;
    })
    .await;
}

#[allure_test(name = "Header bar matches screenshot")]
#[tokio::test]
async fn header_bar_matches_screenshot_390() {
    header_bar_matches_screenshot(390).await;
}

#[allure_test(name = "Header bar matches screenshot")]
#[tokio::test]
async fn header_bar_matches_screenshot_768() {
    header_bar_matches_screenshot(768).await;
}

#[allure_test(name = "Header bar matches screenshot")]
#[tokio::test]
async fn header_bar_matches_screenshot_1280() {
    header_bar_matches_screenshot(1280).await;
}
