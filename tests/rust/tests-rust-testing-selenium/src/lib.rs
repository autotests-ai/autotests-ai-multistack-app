mod client;
mod config;
mod layout_css;
mod local_chrome_pin;
mod meta;
mod mock_scenarios;
mod pages;
mod screenshot;
mod tokens_css;
mod ui;
mod user;
mod viewport;
mod webdriver;

pub use client::*;
pub use config::*;
pub use layout_css::*;
pub use local_chrome_pin::{apply, major as chrome_major, pinned_version, ChromeBinaries};
pub use meta::*;
pub use mock_scenarios::{available as mock_available, reset_all as mock_reset_all, set_state as mock_set_state};
pub use pages::*;
pub use screenshot::{
    capture_and_compare, screenshot_browser_folder, screenshot_mode, screenshot_mode_for,
    screenshot_os,
};
pub use tokens_css::{default_tokens_path, first_existing, parse_root_tokens, resolve_from_app_root};
pub use user::*;
pub use viewport::{reset_viewport, set_viewport};
pub use webdriver::{require_chrome, with_browser};

/// Thread-bound Allure facade from `#[allure_test]`, else the process default.
pub fn allure_facade() -> allure_rust_commons::AllureFacade {
    allure_rust_commons::current_allure().unwrap_or_else(|| allure_rust_commons::allure().clone())
}
