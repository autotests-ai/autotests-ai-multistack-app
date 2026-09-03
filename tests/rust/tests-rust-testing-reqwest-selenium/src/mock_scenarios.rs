use reqwest::Method;
use serde_json::json;

use crate::config::{load_config, resolve_api_base_url, HTTP_TIMEOUT};
use crate::{allure_facade, request, RequestOpt};

/// WireMock scenario switch for the mock stand (`/__admin/` via the gateway).
pub async fn available() -> bool {
    match admin_get("/__admin/scenarios").await {
        Ok(status) => status == 200,
        Err(_) => false,
    }
}

pub async fn set_state(scenario: &str, state: &str) {
    let path = format!("/__admin/scenarios/{scenario}/state");
    let res = request(
        allure_facade(),
        Method::PUT,
        &path,
        RequestOpt {
            json: Some(json!({ "state": state })),
            ..Default::default()
        },
    )
    .await;
    assert_eq!(res.status, 200, "{}", res.text());
}

pub async fn reset_all() {
    let res = request(
        allure_facade(),
        Method::POST,
        "/__admin/scenarios/reset",
        RequestOpt::default(),
    )
    .await;
    assert_eq!(res.status, 200, "{}", res.text());
}

async fn admin_get(path: &str) -> Result<u16, String> {
    let origin = resolve_api_base_url(&load_config())?.trim_end_matches('/').to_string();
    let url = format!("{origin}{path}");
    let http = reqwest::Client::builder()
        .timeout(HTTP_TIMEOUT)
        .build()
        .map_err(|err| err.to_string())?;
    let response = http.get(url).send().await.map_err(|err| err.to_string())?;
    Ok(response.status().as_u16())
}
