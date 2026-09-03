use allure_cargotest::allure_test;
use tests_rust_testing_selenium as tests;

const VIEWPORT_HEIGHT: i32 = 900;

fn layer() {
    tests::layer_e2e("Welcome panel", "Authentication", "Welcome panel", "minor");
    allure_rust_commons::sub_suite("screenshot");
    allure_rust_commons::tag("screenshot");
}

async fn welcome_panel_matches_screenshot(viewport_width: i32) {
    layer();
    let welcome = format!("Welcome, {}!", tests::load_config().welcome_username);
    tests::with_browser(move || async move {
        tests::set_viewport(viewport_width, VIEWPORT_HEIGHT).await;
        let home = tests::LoginPage::default()
            .open_page()
            .await
            .fill_and_submit_form("user1", "password1")
            .await
            .should_have_welcome_message(&welcome)
            .await;
        let panel = home.welcome_panel_element().await;
        tests::capture_and_compare(
            &panel,
            "welcome-panel",
            viewport_width,
            &format!("welcome-panel-{viewport_width}"),
        )
        .await;
    })
    .await;
}

#[allure_test(name = "Welcome panel matches screenshot")]
#[tokio::test]
async fn welcome_panel_matches_screenshot_390() {
    welcome_panel_matches_screenshot(390).await;
}

#[allure_test(name = "Welcome panel matches screenshot")]
#[tokio::test]
async fn welcome_panel_matches_screenshot_768() {
    welcome_panel_matches_screenshot(768).await;
}

#[allure_test(name = "Welcome panel matches screenshot")]
#[tokio::test]
async fn welcome_panel_matches_screenshot_1280() {
    welcome_panel_matches_screenshot(1280).await;
}
