use serde_json::json;
use thirtyfour::extensions::cdp::ChromeDevTools;

use crate::config::load_config;
use crate::webdriver;

pub async fn reset_viewport() {
    if !webdriver::has_session().await {
        return;
    }
    let driver = webdriver::driver().await;
    if !try_cdp(
        &driver,
        "Emulation.clearDeviceMetricsOverride",
        json!({}),
    )
    .await
    {
        let size = webdriver::parse_browser_size(&load_config().browser_size)
            .unwrap_or_else(|| panic!("Invalid browserSize: {}", load_config().browser_size));
        driver
            .set_window_rect(0, 0, size.0, size.1)
            .await
            .unwrap_or_else(|err| panic!("reset window size: {err}"));
    }
}

pub async fn set_viewport(width: i32, height: i32) {
    if !webdriver::has_session().await {
        webdriver::start_blank().await;
    }
    let driver = webdriver::driver().await;
    let _ = try_cdp(&driver, "Emulation.clearDeviceMetricsOverride", json!({})).await;
    let metrics = json!({
        "width": width,
        "height": height,
        "deviceScaleFactor": 1,
        "mobile": false,
    });
    if !try_cdp(&driver, "Emulation.setDeviceMetricsOverride", metrics).await {
        driver
            .set_window_rect(0, 0, width as u32, height as u32)
            .await
            .unwrap_or_else(|err| panic!("set window size: {err}"));
    }
}

async fn try_cdp(driver: &thirtyfour::WebDriver, command: &str, params: serde_json::Value) -> bool {
    let devtools = ChromeDevTools::new(driver.handle.clone());
    devtools
        .execute_cdp_with_params(command, params)
        .await
        .is_ok()
}
