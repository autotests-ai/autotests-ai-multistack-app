use allure_cargotest::allure_test;
use tests_rust_testing_selenium as tests;

const VIEWPORT_HEIGHT: i32 = 900;

fn layer() {
    tests::layer_ui("Login", "Authentication", "Login form", "minor");
    allure_rust_commons::sub_suite("screenshot");
    allure_rust_commons::tag("screenshot");
}

async fn login_form_matches_screenshot(viewport_width: i32) {
    layer();
    tests::with_browser(|| async move {
        tests::set_viewport(viewport_width, VIEWPORT_HEIGHT).await;
        tests::LoginPage::default().open_page().await;
        let panel = tests::LoginPage::default().login_form_panel().await;
        tests::capture_and_compare(
            &panel,
            "login",
            viewport_width,
            &format!("login-{viewport_width}"),
        )
        .await;
    })
    .await;
}

#[allure_test(name = "Login form matches screenshot")]
#[tokio::test]
async fn login_form_matches_screenshot_390() {
    login_form_matches_screenshot(390).await;
}

#[allure_test(name = "Login form matches screenshot")]
#[tokio::test]
async fn login_form_matches_screenshot_768() {
    login_form_matches_screenshot(768).await;
}

#[allure_test(name = "Login form matches screenshot")]
#[tokio::test]
async fn login_form_matches_screenshot_1280() {
    login_form_matches_screenshot(1280).await;
}
