use allure_cargotest::allure_test;
use tests_rust_testing_reqwest_selenium as tests;

fn layer() {
    tests::layer_ui("Burger menu", "Header", "Burger menu", "normal");
}

#[allure_test(name = "Menu nav marks Login active on the login page")]
#[tokio::test]
async fn menu_nav_marks_active_login() {
    layer();
    tests::with_browser(|| async {
        tests::LoginPage::default()
            .header
            .set_mobile_viewport()
            .await;
        tests::LoginPage::default()
            .open_page()
            .await
            .header
            .open_menu()
            .await
            .should_have_active_menu_nav("header-menu-nav-login")
            .await;
        tests::LoginPage::default().header.reset_viewport().await;
    })
    .await;
}

#[allure_test(name = "Menu Register opens the register page and closes the menu")]
#[tokio::test]
async fn clicking_register_opens_register_and_closes_menu() {
    layer();
    tests::with_browser(|| async {
        tests::LoginPage::default()
            .header
            .set_mobile_viewport()
            .await;
        tests::LoginPage::default()
            .open_page()
            .await
            .header
            .open_menu()
            .await
            .should_have_active_menu_nav("header-menu-nav-login")
            .await
            .click_menu_nav("header-menu-nav-register")
            .await;
        tests::RegisterPage::default()
            .should_be_open()
            .await
            .header
            .should_have_closed_menu()
            .await;
        tests::LoginPage::default().header.reset_viewport().await;
    })
    .await;
}

#[allure_test(name = "Menu Login opens the login page and closes the menu")]
#[tokio::test]
async fn clicking_login_opens_login_and_closes_menu() {
    layer();
    tests::with_browser(|| async {
        tests::LoginPage::default()
            .header
            .set_mobile_viewport()
            .await;
        tests::RegisterPage::default()
            .open_page()
            .await
            .header
            .open_menu()
            .await
            .click_menu_nav("header-menu-nav-login")
            .await;
        tests::LoginPage::default()
            .should_be_open()
            .await
            .header
            .should_have_closed_menu()
            .await;
        tests::LoginPage::default().header.reset_viewport().await;
    })
    .await;
}
