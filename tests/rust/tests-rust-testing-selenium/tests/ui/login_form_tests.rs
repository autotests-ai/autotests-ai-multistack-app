use allure_cargotest::allure_test;
use tests_rust_testing_selenium as tests;

#[allure_test(name = "Login form fields and submit are visible")]
#[tokio::test]
async fn login_form_is_mounted() {
    tests::layer_ui("Login form mount", "Authentication", "Login form", "normal");
    allure_rust_commons::tag("mock");
    tests::with_browser(|| async {
        tests::LoginPage::default()
            .open_page()
            .await
            .should_show_login_form()
            .await
            .should_have_form_title("Login Form")
            .await;
    })
    .await;
}
