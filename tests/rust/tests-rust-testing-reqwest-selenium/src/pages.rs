use serde_json::json;
use thirtyfour::WebElement;

use crate::ui;

#[derive(Clone, Copy, Debug, Default)]
pub struct HeaderComponent;

impl HeaderComponent {
    pub async fn set_mobile_viewport(self) -> Self {
        crate::viewport::set_viewport(375, 812).await;
        self
    }

    pub async fn reset_viewport(self) -> Self {
        crate::viewport::reset_viewport().await;
        self
    }

    pub async fn should_have_active_nav(self, nav_testid: &str) -> Self {
        let locator = ui::test_id(nav_testid);
        ui::should_be_visible_by(locator.clone()).await;
        ui::should_have_css_class(locator.clone(), "is-active").await;
        ui::should_have_attribute_by(locator, "aria-current", "page").await;
        ui::wait_until(|| async {
            let found = ui::all_by(thirtyfour::By::Css(
                "[data-testid='header-nav'] a[aria-current='page']",
            ))
            .await;
            if found.len() == 1 {
                Some(())
            } else {
                None
            }
        })
        .await
        .expect("exactly one aria-current=page in header-nav");
        self
    }

    pub async fn click_nav(self, nav_testid: &str) -> Self {
        ui::click(nav_testid).await;
        self
    }

    pub async fn open_menu(self) -> Self {
        ui::click("header-burger").await;
        ui::should_be_visible("header-menu").await;
        ui::should_have_attribute_by(ui::test_id("header-burger"), "aria-expanded", "true").await;
        self
    }

    pub async fn should_have_active_menu_nav(self, menu_nav_testid: &str) -> Self {
        let locator = ui::test_id(menu_nav_testid);
        ui::should_be_visible_by(locator.clone()).await;
        ui::should_have_css_class(locator.clone(), "is-active").await;
        ui::should_have_attribute_by(locator, "aria-current", "page").await;
        self
    }

    pub async fn click_menu_nav(self, menu_nav_testid: &str) -> Self {
        ui::click(menu_nav_testid).await;
        self
    }

    pub async fn should_have_closed_menu(self) -> Self {
        ui::should_be_hidden_by(ui::test_id("header-menu")).await;
        ui::should_have_attribute_by(ui::test_id("header-burger"), "aria-expanded", "false").await;
        self
    }

    pub async fn menu_panel(self) -> WebElement {
        ui::el("header-menu").await
    }

    pub async fn header_panel(self) -> WebElement {
        ui::el("header").await
    }

    pub async fn should_show_embedded_header(self) -> Self {
        ui::should_be_visible("header").await;
        self
    }

    pub async fn click_lang_toggle(self) -> Self {
        ui::click_by(thirtyfour::By::Css(
            "[data-testid='header-tools'] [data-testid='header-lang-toggle']",
        ))
        .await;
        self
    }

    pub async fn click_theme_toggle(self) -> Self {
        ui::click_by(thirtyfour::By::Css(
            "[data-testid='header-tools'] [data-testid='header-theme-toggle']",
        ))
        .await;
        self
    }

    pub async fn should_have_lang_label(self, label: &str) -> Self {
        ui::should_have_text_by(
            thirtyfour::By::Css(
                "[data-testid='header-tools'] [data-testid='header-lang-label']",
            ),
            label,
        )
        .await;
        self
    }

    pub async fn should_have_html_lang(self, lang: &str) -> Self {
        ui::should_have_attribute_by(thirtyfour::By::Css("html"), "lang", lang).await;
        self
    }

    pub async fn should_have_theme(self, theme: &str) -> Self {
        let html = thirtyfour::By::Css("html");
        if theme == "light" {
            ui::should_have_css_class(html, "theme-light").await;
        } else {
            ui::should_not_have_css_class(html, "theme-light").await;
        }
        self
    }
}

#[derive(Clone, Copy, Debug, Default)]
pub struct LoginPage {
    pub header: HeaderComponent,
}

impl LoginPage {
    pub async fn open_page(self) -> Self {
        ui::open("/login").await;
        self.should_be_open().await
    }

    pub async fn click_register_link(self) -> RegisterPage {
        ui::click("register-link").await;
        RegisterPage::default()
    }

    pub async fn fill_and_submit_form(self, username: &str, password: &str) -> HomePage {
        self.type_username(username).await;
        self.type_password(password).await;
        self.submit().await
    }

    pub async fn type_username(self, username: &str) -> Self {
        ui::set_value("login-input", username).await;
        self
    }

    pub async fn type_password(self, password: &str) -> Self {
        ui::set_value("password-input", password).await;
        self
    }

    pub async fn submit(self) -> HomePage {
        ui::click("submit-button").await;
        HomePage::default()
    }

    pub async fn submit_expecting_error(self) -> Self {
        ui::click("submit-button").await;
        ui::should_be_visible("error-message").await;
        self
    }

    pub async fn should_be_open(self) -> Self {
        ui::should_be_visible("login-form").await;
        self
    }

    pub async fn should_show_login_form(self) -> Self {
        ui::should_be_visible("login-form-title").await;
        ui::should_be_visible("login-input").await;
        ui::should_be_visible("password-input").await;
        ui::should_be_visible("submit-button").await;
        self
    }

    pub async fn login_form_panel(self) -> WebElement {
        ui::el("login-form").await
    }

    pub async fn should_have_form_title(self, message: &str) -> Self {
        ui::should_have_text("login-form-title", message).await;
        self
    }

    pub async fn should_have_error_message(self, message: &str) -> Self {
        ui::should_have_text("error-message", message).await;
        self
    }

    pub async fn reload_page(self) -> Self {
        ui::refresh().await;
        self.should_be_open().await
    }
}

#[derive(Clone, Copy, Debug, Default)]
pub struct RegisterPage {
    pub header: HeaderComponent,
}

impl RegisterPage {
    pub async fn open_page(self) -> Self {
        ui::open("/register").await;
        self.should_be_open().await
    }

    pub async fn click_login_link(self) -> LoginPage {
        ui::click("login-link").await;
        LoginPage::default()
    }

    pub async fn fill_and_submit_form(
        self,
        username: &str,
        password: &str,
        confirm_password: &str,
    ) -> HomePage {
        self.type_username(username).await;
        self.type_password(password).await;
        self.type_confirm_password(confirm_password).await;
        self.submit().await
    }

    pub async fn type_username(self, username: &str) -> Self {
        ui::set_value("register-login-input", username).await;
        self
    }

    pub async fn type_password(self, password: &str) -> Self {
        ui::set_value("register-password-input", password).await;
        self
    }

    pub async fn type_confirm_password(self, confirm_password: &str) -> Self {
        ui::set_value("confirm-password-input", confirm_password).await;
        self
    }

    pub async fn submit(self) -> HomePage {
        ui::click("register-submit-button").await;
        HomePage::default()
    }

    pub async fn submit_expecting_error(self) -> Self {
        ui::click("register-submit-button").await;
        ui::should_be_visible("register-error-message").await;
        self
    }

    pub async fn should_be_open(self) -> Self {
        ui::should_be_visible("register-form").await;
        self
    }

    pub async fn should_show_register_form(self) -> Self {
        ui::should_be_visible("register-form-title").await;
        ui::should_be_visible("register-login-input").await;
        ui::should_be_visible("register-password-input").await;
        ui::should_be_visible("confirm-password-input").await;
        ui::should_be_visible("register-submit-button").await;
        self
    }

    pub async fn should_have_form_title(self, message: &str) -> Self {
        ui::should_have_text("register-form-title", message).await;
        self
    }

    pub async fn should_have_error_message(self, message: &str) -> Self {
        ui::should_be_visible("register-error-message").await;
        ui::should_have_text("register-error-message", message).await;
        self
    }

    pub async fn reload_page(self) -> Self {
        ui::refresh().await;
        self.should_be_open().await
    }
}

#[derive(Clone, Copy, Debug, Default)]
pub struct HomePage {
    pub header: HeaderComponent,
}

impl HomePage {
    const AUTH_TOKEN_KEY_JS: &'static str =
        "var m=location.pathname.match(/\\/(backend-[^/]+)\\//);\
         return m ? 'authToken:' + m[1] : 'authToken';";
    const DELETE_ACCOUNT_CONFIRM: &'static str =
        "Delete this account? This cannot be undone.";

    async fn auth_token_key() -> String {
        ui::js(Self::AUTH_TOKEN_KEY_JS, vec![])
            .await
            .as_str()
            .unwrap_or("authToken")
            .to_string()
    }

    pub async fn open_page(self) -> Self {
        ui::open("/").await;
        self.should_be_open().await
    }

    pub async fn open_page_with_local_storage_authentication(
        self,
        username: &str,
        password: &str,
    ) -> Self {
        let token = crate::login(crate::allure_facade(), username, password).await;
        ui::open("/login").await;
        let key = Self::auth_token_key().await;
        ui::js(
            "localStorage.setItem(arguments[0], arguments[1]);",
            vec![json!(key), json!(token)],
        )
        .await;
        ui::open("/").await;
        self.should_be_open().await
    }

    pub async fn open_page_with_invalid_token(self) -> Self {
        ui::open("/login").await;
        let key = Self::auth_token_key().await;
        ui::js(
            "localStorage.setItem(arguments[0], arguments[1]);",
            vec![json!(key), json!("invalid-token")],
        )
        .await;
        ui::open("/").await;
        self.should_be_open().await
    }

    pub async fn should_be_open(self) -> Self {
        ui::should_be_visible("multistack-layout").await;
        self
    }

    pub async fn should_show_layout(self) -> Self {
        ui::should_be_visible("multistack-layout").await;
        ui::should_be_visible("items-list").await;
        self
    }

    pub async fn should_show_layout_and_health(self) -> Self {
        ui::should_be_visible("multistack-layout").await;
        ui::should_be_visible("health-status").await;
        self
    }

    pub async fn layout_panel(self) -> WebElement {
        ui::el("multistack-layout").await
    }

    pub async fn welcome_panel_element(self) -> WebElement {
        ui::el("welcome-panel").await
    }

    pub async fn should_hide_welcome_panel(self) -> Self {
        ui::should_have_attribute("welcome-panel", "hidden", "").await;
        self
    }

    pub async fn should_clear_auth_token(self) -> Self {
        let key = Self::auth_token_key().await;
        ui::wait_until(|| {
            let key = key.clone();
            async move {
                let value = ui::js(
                    "return localStorage.getItem(arguments[0]);",
                    vec![json!(key)],
                )
                .await;
                if value.is_null() {
                    Some(())
                } else {
                    None
                }
            }
        })
        .await
        .expect("auth token cleared");
        self
    }

    pub async fn should_show_health_text(self, text_fragment: &str) -> Self {
        ui::should_have_text("health-status", text_fragment).await;
        self
    }

    pub async fn should_show_item_text(self, text_fragment: &str) -> Self {
        ui::should_have_text("items-list", text_fragment).await;
        self
    }

    pub async fn should_show_items_error(self, text_fragment: &str) -> Self {
        ui::should_have_text("items-list", text_fragment).await;
        self
    }

    pub async fn should_show_health_error(self, text_fragment: &str) -> Self {
        ui::should_have_text("health-status", text_fragment).await;
        self
    }

    pub async fn should_have_welcome_message(self, message: &str) -> Self {
        ui::should_be_visible("welcome-panel").await;
        ui::should_have_text("welcome-message", message).await;
        self
    }

    pub async fn should_show_session_actions(self) -> Self {
        ui::should_be_visible("logout-button").await;
        ui::should_have_text("logout-button", "Logout").await;
        ui::should_be_visible("delete-account-button").await;
        ui::should_have_text("delete-account-button", "Delete account").await;
        self
    }

    pub async fn click_logout_button(self) -> LoginPage {
        ui::click("logout-button").await;
        LoginPage::default()
    }

    pub async fn click_delete_account_and_confirm(self) -> LoginPage {
        ui::click("delete-account-button").await;
        ui::confirm(Self::DELETE_ACCOUNT_CONFIRM).await;
        LoginPage::default()
    }

    pub async fn click_delete_account_and_cancel(self) -> Self {
        ui::click("delete-account-button").await;
        ui::dismiss(Self::DELETE_ACCOUNT_CONFIRM).await;
        self
    }

    pub async fn should_keep_auth_token(self) -> Self {
        let key = Self::auth_token_key().await;
        ui::wait_until(|| {
            let key = key.clone();
            async move {
                let value = ui::js(
                    "return localStorage.getItem(arguments[0]);",
                    vec![json!(key)],
                )
                .await;
                if value.is_null() {
                    None
                } else {
                    Some(())
                }
            }
        })
        .await
        .expect("auth token kept");
        self
    }

    pub async fn reload_page(self) -> Self {
        ui::refresh().await;
        self.should_be_open().await
    }
}
