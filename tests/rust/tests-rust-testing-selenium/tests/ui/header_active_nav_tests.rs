use allure_cargotest::allure_test;
use tests_rust_testing_selenium as tests;

fn layer() {
    tests::layer_ui("Header active nav", "Header", "Active nav", "normal");
}

#[allure_test(name = "Login page marks Login as the active header nav")]
#[tokio::test]
async fn login_page_marks_active_login() {
    layer();
    allure_rust_commons::tag("smoke");
    tests::with_browser(|| async {
        tests::LoginPage::default()
            .open_page()
            .await
            .header
            .should_have_active_nav("header-nav-login")
            .await;
    })
    .await;
}

#[allure_test(name = "Register page marks Register as the active header nav")]
#[tokio::test]
async fn register_page_marks_active_register() {
    layer();
    tests::with_browser(|| async {
        tests::RegisterPage::default()
            .open_page()
            .await
            .header
            .should_have_active_nav("header-nav-register")
            .await;
    })
    .await;
}

#[allure_test(name = "Home page marks Home as the active header nav")]
#[tokio::test]
async fn home_page_marks_active_home() {
    layer();
    tests::with_browser(|| async {
        tests::HomePage::default()
            .open_page()
            .await
            .header
            .should_have_active_nav("header-nav-home")
            .await;
    })
    .await;
}

#[allure_test(name = "In-form Register link syncs the active header nav")]
#[tokio::test]
async fn in_form_register_link_syncs_active_nav() {
    layer();
    tests::with_browser(|| async {
        tests::LoginPage::default()
            .open_page()
            .await
            .header
            .should_have_active_nav("header-nav-login")
            .await;
        tests::LoginPage::default()
            .click_register_link()
            .await
            .should_be_open()
            .await
            .header
            .should_have_active_nav("header-nav-register")
            .await;
    })
    .await;
}

#[allure_test(name = "In-form Login link syncs the active header nav")]
#[tokio::test]
async fn in_form_login_link_syncs_active_nav() {
    layer();
    tests::with_browser(|| async {
        tests::RegisterPage::default()
            .open_page()
            .await
            .header
            .should_have_active_nav("header-nav-register")
            .await;
        tests::RegisterPage::default()
            .click_login_link()
            .await
            .should_be_open()
            .await
            .header
            .should_have_active_nav("header-nav-login")
            .await;
    })
    .await;
}

#[allure_test(name = "Header nav Register opens register and marks it active")]
#[tokio::test]
async fn header_nav_register_opens_register() {
    layer();
    tests::with_browser(|| async {
        tests::LoginPage::default()
            .open_page()
            .await
            .header
            .click_nav("header-nav-register")
            .await;
        tests::RegisterPage::default()
            .should_be_open()
            .await
            .header
            .should_have_active_nav("header-nav-register")
            .await;
    })
    .await;
}

#[allure_test(name = "Header nav Login opens login and marks it active")]
#[tokio::test]
async fn header_nav_login_opens_login() {
    layer();
    tests::with_browser(|| async {
        tests::RegisterPage::default()
            .open_page()
            .await
            .header
            .click_nav("header-nav-login")
            .await;
        tests::LoginPage::default()
            .should_be_open()
            .await
            .header
            .should_have_active_nav("header-nav-login")
            .await;
    })
    .await;
}
