use allure_cargotest::allure_test;
use tests_rust_testing_reqwest_selenium as tests;

fn layer() {
    tests::layer_ui("Header", "Header", "Lang and theme", "normal");
}

#[allure_test(name = "Login page stays English by default")]
#[tokio::test]
async fn login_page_stays_english_by_default() {
    layer();
    tests::with_browser(|| async {
        tests::LoginPage::default()
            .open_page()
            .await
            .should_have_form_title("Login Form")
            .await
            .header
            .should_have_lang_label("EN")
            .await
            .should_have_html_lang("en")
            .await;
    })
    .await;
}

#[allure_test(name = "Theme toggle persists light theme after reload")]
#[tokio::test]
async fn theme_toggle_persists_light_theme_after_reload() {
    layer();
    tests::with_browser(|| async {
        tests::LoginPage::default()
            .open_page()
            .await
            .should_have_form_title("Login Form")
            .await
            .header
            .should_have_theme("dark")
            .await
            .click_theme_toggle()
            .await
            .should_have_theme("light")
            .await;
        tests::LoginPage::default()
            .reload_page()
            .await
            .header
            .should_have_theme("light")
            .await;
    })
    .await;
}

#[allure_test(name = "Lang toggle switches login copy to Russian and back")]
#[tokio::test]
async fn lang_toggle_switches_login_copy_to_russian_and_back() {
    layer();
    tests::with_browser(|| async {
        tests::LoginPage::default()
            .open_page()
            .await
            .should_have_form_title("Login Form")
            .await
            .header
            .click_lang_toggle()
            .await
            .should_have_lang_label("RU")
            .await
            .should_have_html_lang("ru")
            .await;
        tests::LoginPage::default()
            .should_have_form_title("Форма входа")
            .await
            .reload_page()
            .await
            .header
            .should_have_lang_label("RU")
            .await
            .should_have_html_lang("ru")
            .await;
        tests::LoginPage::default()
            .should_have_form_title("Форма входа")
            .await
            .header
            .click_lang_toggle()
            .await
            .should_have_lang_label("EN")
            .await
            .should_have_html_lang("en")
            .await;
        tests::LoginPage::default()
            .should_have_form_title("Login Form")
            .await;
    })
    .await;
}
