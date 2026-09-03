use std::future::Future;
use std::time::{Duration, Instant};

use serde_json::json;
use thirtyfour::{By, WebElement};

use crate::config::must_base_url;
use crate::webdriver;

pub const TIMEOUT: Duration = Duration::from_secs(5);

const SET_VALUE_JS: &str = r"
const el = arguments[0];
const value = arguments[1];
const setter = Object.getOwnPropertyDescriptor(
  window.HTMLInputElement.prototype, 'value'
).set;
setter.call(el, value);
el.dispatchEvent(new Event('input', { bubbles: true }));
el.dispatchEvent(new Event('change', { bubbles: true }));
";

pub fn test_id(id: &str) -> By {
    By::Css(format!("[data-testid='{id}']"))
}

pub async fn open(path: &str) {
    let base = must_base_url();
    if path.is_empty() || path == "/" {
        webdriver::driver()
            .await
            .goto(base)
            .await
            .unwrap_or_else(|err| panic!("open /: {err}"));
        return;
    }
    let relative = path.trim_start_matches('/');
    let url = format!("{}{relative}", base);
    webdriver::driver()
        .await
        .goto(url)
        .await
        .unwrap_or_else(|err| panic!("open {path}: {err}"));
}

pub async fn refresh() {
    webdriver::driver()
        .await
        .refresh()
        .await
        .unwrap_or_else(|err| panic!("refresh: {err}"));
}

pub async fn el_by(locator: By) -> WebElement {
    let css = format!("{locator:?}");
    wait_until(|| {
        let locator = locator.clone();
        async move {
            let found = webdriver::driver().await.find_all(locator).await.ok()?;
            let first = found.into_iter().next()?;
            match first.is_displayed().await {
                Ok(true) => Some(first),
                _ => None,
            }
        }
    })
    .await
    .unwrap_or_else(|| panic!("element not visible: {css}"))
}

pub async fn el(id: &str) -> WebElement {
    el_by(test_id(id)).await
}

pub async fn all_by(locator: By) -> Vec<WebElement> {
    webdriver::driver()
        .await
        .find_all(locator)
        .await
        .unwrap_or_default()
}

pub async fn click_by(locator: By) {
    let css = format!("{locator:?}");
    let element = wait_until(|| {
        let locator = locator.clone();
        async move {
            let found = webdriver::driver().await.find_all(locator).await.ok()?;
            let first = found.into_iter().next()?;
            let displayed = first.is_displayed().await.ok()?;
            let enabled = first.is_enabled().await.ok()?;
            if displayed && enabled {
                Some(first)
            } else {
                None
            }
        }
    })
    .await
    .unwrap_or_else(|| panic!("click target not ready: {css}"));
    element
        .click()
        .await
        .unwrap_or_else(|err| panic!("click {css}: {err}"));
}

pub async fn click(id: &str) {
    click_by(test_id(id)).await;
}

pub async fn confirm(expected_text: &str) {
    let actual = wait_alert_text().await;
    if actual != expected_text {
        panic!("Confirm text: expected <{expected_text}> but was <{actual}>");
    }
    webdriver::driver()
        .await
        .accept_alert()
        .await
        .unwrap_or_else(|err| panic!("accept alert: {err}"));
}

pub async fn dismiss(expected_text: &str) {
    let actual = wait_alert_text().await;
    if actual != expected_text {
        panic!("Confirm text: expected <{expected_text}> but was <{actual}>");
    }
    webdriver::driver()
        .await
        .dismiss_alert()
        .await
        .unwrap_or_else(|err| panic!("dismiss alert: {err}"));
}

async fn wait_alert_text() -> String {
    wait_until(|| async {
        webdriver::driver().await.get_alert_text().await.ok()
    })
    .await
    .expect("alert")
}

pub async fn set_value_by(locator: By, value: &str) {
    let element = el_by(locator).await;
    webdriver::driver()
        .await
        .execute(
            SET_VALUE_JS,
            vec![
                element.to_json().expect("element json"),
                json!(value),
            ],
        )
        .await
        .unwrap_or_else(|err| panic!("setValue: {err}"));
}

pub async fn set_value(id: &str, value: &str) {
    set_value_by(test_id(id), value).await;
}

pub async fn should_be_visible_by(locator: By) {
    let _ = el_by(locator).await;
}

pub async fn should_be_visible(id: &str) {
    should_be_visible_by(test_id(id)).await;
}

pub async fn should_be_hidden_by(locator: By) {
    let css = format!("{locator:?}");
    wait_until(|| {
        let locator = locator.clone();
        async move {
            let found = webdriver::driver().await.find_all(locator).await.ok()?;
            if found.is_empty() {
                return Some(());
            }
            match found[0].is_displayed().await {
                Ok(false) => Some(()),
                _ => None,
            }
        }
    })
    .await
    .unwrap_or_else(|| panic!("still visible: {css}"));
}

pub async fn should_have_text_by(locator: By, text: &str) {
    let css = format!("{locator:?}");
    let expected = text.to_string();
    wait_until(|| {
        let locator = locator.clone();
        let expected = expected.clone();
        async move {
            let found = webdriver::driver().await.find_all(locator).await.ok()?;
            let first = found.into_iter().next()?;
            if !first.is_displayed().await.ok()? {
                return None;
            }
            first
                .text()
                .await
                .ok()
                .filter(|actual| actual.contains(&expected))
                .map(|_| ())
        }
    })
    .await
    .unwrap_or_else(|| panic!("text {text:?} not in {css}"));
}

pub async fn should_have_text(id: &str, text: &str) {
    should_have_text_by(test_id(id), text).await;
}

pub async fn should_have_attribute_by(locator: By, name: &str, value: &str) {
    let css = format!("{locator:?}");
    let name = name.to_string();
    let value = value.to_string();
    wait_until(|| {
        let locator = locator.clone();
        let name = name.clone();
        let value = value.clone();
        async move {
            let found = webdriver::driver().await.find_all(locator).await.ok()?;
            let first = found.into_iter().next()?;
            let actual = first.attr(&name).await.ok()?;
            if value.is_empty() {
                actual.map(|_| ())
            } else if actual.as_deref() == Some(value.as_str()) {
                Some(())
            } else {
                None
            }
        }
    })
    .await
    .unwrap_or_else(|| panic!("attribute {name}={value:?} on {css}"));
}

pub async fn should_have_attribute(id: &str, name: &str, value: &str) {
    should_have_attribute_by(test_id(id), name, value).await;
}

pub async fn should_have_css_class(locator: By, css_class: &str) {
    let label = css_class.to_string();
    wait_until(|| {
        let locator = locator.clone();
        let label = label.clone();
        async move {
            let found = webdriver::driver().await.find_all(locator).await.ok()?;
            if has_class(&found, &label).await {
                Some(())
            } else {
                None
            }
        }
    })
    .await
    .unwrap_or_else(|| panic!("missing class {css_class}"));
}

pub async fn should_not_have_css_class(locator: By, css_class: &str) {
    let label = css_class.to_string();
    wait_until(|| {
        let locator = locator.clone();
        let label = label.clone();
        async move {
            let found = webdriver::driver().await.find_all(locator).await.ok()?;
            if !has_class(&found, &label).await {
                Some(())
            } else {
                None
            }
        }
    })
    .await
    .unwrap_or_else(|| panic!("unexpected class {css_class}"));
}

pub async fn js(script: &str, args: Vec<serde_json::Value>) -> serde_json::Value {
    webdriver::driver()
        .await
        .execute(script, args)
        .await
        .unwrap_or_else(|err| panic!("js: {err}"))
        .json()
        .clone()
}

pub async fn wait_until<T, F, Fut>(mut condition: F) -> Option<T>
where
    F: FnMut() -> Fut,
    Fut: Future<Output = Option<T>>,
{
    let deadline = Instant::now() + TIMEOUT;
    loop {
        if let Some(value) = condition().await {
            return Some(value);
        }
        if Instant::now() >= deadline {
            return None;
        }
        tokio::time::sleep(Duration::from_millis(100)).await;
    }
}

async fn has_class(found: &[WebElement], css_class: &str) -> bool {
    let Some(first) = found.first() else {
        return false;
    };
    let Ok(Some(classes)) = first.attr("class").await else {
        return false;
    };
    classes.split_whitespace().any(|item| item == css_class)
}
