use allure_reqwest::{AllureReqwestClient, CaptureOptions};
use allure_rust_commons::AllureFacade;
use reqwest::Method;
use serde_json::{json, Value};

use crate::config::{ensure_allure_results_dir, must_api_base_url, HTTP_TIMEOUT};

pub const WRONG_CREDENTIALS_MESSAGE: &str = "Wrong login or password";

pub struct RequestOpt {
    pub json: Option<Value>,
    pub raw: Option<String>,
    pub token: Option<String>,
}

impl Default for RequestOpt {
    fn default() -> Self {
        Self {
            json: None,
            raw: None,
            token: None,
        }
    }
}

pub struct HttpResult {
    pub status: u16,
    pub raw: Vec<u8>,
}

impl HttpResult {
    pub fn json(&self) -> Value {
        serde_json::from_slice(&self.raw).unwrap_or(Value::Null)
    }

    pub fn text(&self) -> String {
        String::from_utf8_lossy(&self.raw).into_owned()
    }

    pub fn map(&self) -> serde_json::Map<String, Value> {
        self.json()
            .as_object()
            .cloned()
            .expect("JSON object body")
    }
}

fn path_of(path: &str) -> String {
    if path.starts_with('/') {
        path.to_string()
    } else {
        format!("/{path}")
    }
}

/// Username is a throwaway identity; backend @Size(min=3, max=64).
pub fn username() -> String {
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    format!("user_{nanos:x}")
}

pub async fn request(allure: AllureFacade, method: Method, path: &str, opt: RequestOpt) -> HttpResult {
    ensure_allure_results_dir();
    let base = must_api_base_url().trim_end_matches('/').to_string();
    let url = format!("{}{}", base, path_of(path));
    let http = reqwest::Client::builder()
        .timeout(HTTP_TIMEOUT)
        .build()
        .expect("reqwest client");
    let client = AllureReqwestClient::with_client(http, allure).with_options(
        CaptureOptions::default().with_response_body_capture(64 * 1024),
    );
    let mut builder = client.request(method, url);
    if let Some(raw) = opt.raw {
        builder = builder
            .header("content-type", "application/json")
            .body(raw);
    } else if let Some(body) = opt.json {
        builder = builder
            .header("content-type", "application/json")
            .body(body.to_string());
    }
    if let Some(token) = opt.token {
        builder = builder.header("authorization", format!("Bearer {token}"));
    }
    let response = client.send(builder).await.expect("HTTP transport");
    let status = response.status().as_u16();
    let raw = response.bytes().await.expect("response body").to_vec();
    HttpResult { status, raw }
}

pub async fn login(allure: AllureFacade, username: &str, password: &str) -> String {
    let res = request(
        allure,
        Method::POST,
        "/api/auth/login",
        RequestOpt {
            json: Some(json!({"username": username, "password": password})),
            ..Default::default()
        },
    )
    .await;
    assert_eq!(res.status, 200, "{}", res.text());
    let token = res
        .map()
        .get("token")
        .and_then(Value::as_str)
        .unwrap_or("")
        .to_string();
    assert!(!token.is_empty(), "token");
    token
}

pub async fn register(allure: AllureFacade, username: &str, password: &str) -> String {
    let res = request(
        allure,
        Method::POST,
        "/api/auth/register",
        RequestOpt {
            json: Some(json!({"username": username, "password": password})),
            ..Default::default()
        },
    )
    .await;
    assert_eq!(res.status, 201, "{}", res.text());
    let token = res
        .map()
        .get("token")
        .and_then(Value::as_str)
        .unwrap_or("")
        .to_string();
    assert!(!token.is_empty(), "token");
    token
}

pub async fn delete_account(allure: AllureFacade, token: &str) {
    let res = request(
        allure,
        Method::DELETE,
        "/api/auth/me",
        RequestOpt {
            token: Some(token.to_string()),
            ..Default::default()
        },
    )
    .await;
    assert_eq!(res.status, 204, "{}", res.text());
}

pub fn item_names(body: &serde_json::Map<String, Value>) -> Vec<String> {
    let items = body
        .get("items")
        .and_then(Value::as_array)
        .expect("items array");
    items
        .iter()
        .map(|item| {
            item.as_object()
                .and_then(|row| row.get("name"))
                .and_then(Value::as_str)
                .unwrap_or("")
                .to_string()
        })
        .collect()
}
