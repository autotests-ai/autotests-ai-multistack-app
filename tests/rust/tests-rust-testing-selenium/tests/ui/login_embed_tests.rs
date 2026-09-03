use allure_cargotest::allure_test;
use tests_rust_testing_selenium as tests;

#[allure_test(name = "Embedded header is visible on login page")]
#[tokio::test]
async fn embedded_header_is_visible_on_login_page() {
    tests::layer_ui("Login embed", "Authentication", "Login embed", "normal");
    allure_rust_commons::tag("mock");
    tests::with_browser(|| async {
        tests::LoginPage::default()
            .open_page()
            .await
            .should_have_form_title("Login Form")
            .await
            .header
            .should_show_embedded_header()
            .await;
    })
    .await;
}
