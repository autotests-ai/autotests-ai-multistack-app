//! Official tag1consulting/goose school: closed VU, vegeta-compatible JSONL overlay.
//! Overlay: build/goose/results.json → load_injector_* (not goose_*).

use std::env;
use std::fs::{self, File};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::Duration;

use chrono::SecondsFormat;
use goose::goose::GooseResponse;
use goose::metrics::GooseRequestMetric;
use goose::prelude::*;
use serde_json::{json, Value};

static JSONL: Mutex<Option<File>> = Mutex::new(None);

fn first_non_blank(values: &[&str]) -> String {
    for value in values {
        let text = value.trim();
        if !text.is_empty() {
            return text.to_string();
        }
    }
    String::new()
}

fn env_or(key: &str, fallback: &str) -> String {
    first_non_blank(&[env::var(key).unwrap_or_default().as_str(), fallback])
}

fn parse_usize(raw: &str, fallback: usize) -> usize {
    raw.parse::<usize>().unwrap_or(fallback).max(1)
}

fn strip_slash(url: &str) -> String {
    url.trim_end_matches('/').to_string()
}

fn api_base_url() -> String {
    strip_slash(&first_non_blank(&[
        &env::var("API_BASE_URL").unwrap_or_default(),
        &env::var("apiBaseUrl").unwrap_or_default(),
        "http://localhost:8800",
    ]))
}

fn goose_host(base: &str) -> String {
    format!("{base}/")
}

fn username() -> String {
    first_non_blank(&[
        &env::var("LOAD_USERNAME").unwrap_or_default(),
        &env::var("username").unwrap_or_default(),
        "user1",
    ])
}

fn password() -> String {
    first_non_blank(&[
        &env::var("LOAD_PASSWORD").unwrap_or_default(),
        &env::var("password").unwrap_or_default(),
        "password1",
    ])
}

fn profile() -> String {
    env_or("GOOSE_PROFILE", "smoke").to_lowercase()
}

fn allow_public() -> bool {
    env_or("GOOSE_ALLOW_PUBLIC", "false").eq_ignore_ascii_case("true")
}

fn jsonl_path() -> PathBuf {
    let raw = env::var("GOOSE_JSONL").unwrap_or_default();
    if raw.trim().is_empty() {
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("build/goose/results.json")
    } else {
        PathBuf::from(raw)
    }
}

fn html_path() -> PathBuf {
    let raw = env::var("GOOSE_HTML").unwrap_or_default();
    if raw.trim().is_empty() {
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("build/goose/goose-report.html")
    } else {
        PathBuf::from(raw)
    }
}

fn refuse_shared_prod(base_url: &str) {
    let lower = base_url.to_lowercase();
    let host = url_host(&lower);
    let is_load = host == "load.autotests.ai" || host.ends_with(".load.autotests.ai");
    let shared = lower.contains("autotests.ai") || lower.contains("qa.guru");
    if shared && !is_load {
        eprintln!("Refusing {base_url} — only load.autotests.ai is an allowed public SUT (not autotests.ai, not Box2).");
        std::process::exit(1);
    }
    if is_load && !allow_public() {
        eprintln!(
            "Refusing {base_url} — isolated SUT only. Pass GOOSE_ALLOW_PUBLIC=true when the host is the dedicated load stand."
        );
        std::process::exit(1);
    }
}

fn url_host(url: &str) -> String {
    let rest = url
        .split("://")
        .nth(1)
        .unwrap_or(url)
        .split('/')
        .next()
        .unwrap_or("");
    rest.split('@').next_back().unwrap_or(rest).split(':').next().unwrap_or(rest).to_string()
}

fn open_jsonl(path: &Path) {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).expect("create goose JSONL dir");
    }
    let file = File::create(path).unwrap_or_else(|err| {
        panic!("STOP: cannot write goose JSONL {}: {err}", path.display());
    });
    *JSONL.lock().expect("jsonl mutex") = Some(file);
}

fn method_name(method: &GooseMethod) -> &'static str {
    match method {
        GooseMethod::Post => "POST",
        GooseMethod::Put => "PUT",
        GooseMethod::Patch => "PATCH",
        GooseMethod::Delete => "DELETE",
        GooseMethod::Head => "HEAD",
        _ => "GET",
    }
}

fn record(metric: &GooseRequestMetric) {
    let code = u32::from(metric.status_code);
    let error = if metric.success && (1..400).contains(&code) {
        String::new()
    } else if !metric.error.is_empty() {
        metric.error.clone()
    } else if code == 0 {
        "error".to_string()
    } else {
        code.to_string()
    };
    let line = json!({
        "timestamp": chrono::Utc::now().to_rfc3339_opts(SecondsFormat::Millis, true),
        "latency": metric.response_time.saturating_mul(1_000_000),
        "code": code,
        "error": error,
        "method": method_name(&metric.raw.method),
        "url": metric.raw.url,
    });
    if let Some(file) = JSONL.lock().expect("jsonl mutex").as_mut() {
        let _ = writeln!(file, "{line}");
        let _ = file.flush();
    }
}

async fn send(
    user: &mut GooseUser,
    method: GooseMethod,
    path: &'static str,
    name: &'static str,
    token: Option<&str>,
    body: Option<&Value>,
) -> Result<GooseResponse, Box<TransactionError>> {
    let mut builder = user.get_request_builder(&method, path)?;
    builder = builder
        .header("Accept", "application/json")
        .header("User-Agent", "tests-rust-goose")
        .timeout(Duration::from_secs(15));
    if let Some(token) = token.filter(|value| !value.is_empty()) {
        builder = builder.header("Authorization", format!("Bearer {token}"));
    }
    if let Some(body) = body {
        builder = builder.header("Content-Type", "application/json").json(body);
    }
    let request = GooseRequest::builder()
        .method(method)
        .name(name)
        .set_request_builder(builder)
        .build();
    user.request(request).await
}

async fn health(user: &mut GooseUser) -> TransactionResult {
    let goose = send(user, GooseMethod::Get, "api/health", "health", None, None).await?;
    record(&goose.request);
    Ok(())
}

async fn login(user: &mut GooseUser) -> TransactionResult {
    let payload = json!({
        "username": username(),
        "password": password(),
    });
    let goose = send(
        user,
        GooseMethod::Post,
        "api/auth/login",
        "login",
        None,
        Some(&payload),
    )
    .await?;
    record(&goose.request);
    if let Ok(response) = goose.response {
        if let Ok(body) = response.json::<Value>().await {
            let expected = username();
            if let Some(token) = body.get("token").and_then(Value::as_str) {
                if !token.is_empty()
                    && body.get("username").and_then(Value::as_str) == Some(expected.as_str())
                {
                    user.set_session_data(token.to_string());
                }
            }
        }
    }
    Ok(())
}

fn bearer(user: &GooseUser) -> Option<String> {
    user.get_session_data::<String>().cloned()
}

async fn me(user: &mut GooseUser) -> TransactionResult {
    let token = bearer(user);
    let goose = send(
        user,
        GooseMethod::Get,
        "api/auth/me",
        "me",
        token.as_deref(),
        None,
    )
    .await?;
    record(&goose.request);
    Ok(())
}

async fn items(user: &mut GooseUser) -> TransactionResult {
    let goose = send(user, GooseMethod::Get, "api/items", "items", None, None).await?;
    record(&goose.request);
    Ok(())
}

async fn logout(user: &mut GooseUser) -> TransactionResult {
    let token = bearer(user);
    let goose = send(
        user,
        GooseMethod::Post,
        "api/auth/logout",
        "logout",
        token.as_deref(),
        None,
    )
    .await?;
    record(&goose.request);
    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), GooseError> {
    let base = api_base_url();
    refuse_shared_prod(&base);
    let host = goose_host(&base);
    open_jsonl(&jsonl_path());
    let html_report = html_path();
    if let Some(parent) = html_report.parent() {
        fs::create_dir_all(parent).expect("create goose HTML dir");
    }
    let html_report_s = html_report.to_string_lossy().into_owned();
    let mut attack = GooseAttack::initialize()?
        .register_scenario(
            scenario!("AuthApi")
                .register_transaction(transaction!(health).set_name("health"))
                .register_transaction(transaction!(login).set_name("login"))
                .register_transaction(transaction!(me).set_name("me"))
                .register_transaction(transaction!(items).set_name("items"))
                .register_transaction(transaction!(logout).set_name("logout"))
                .set_wait_time(Duration::from_secs(0), Duration::from_secs(0))?,
        )
        .set_default(GooseDefault::Host, host.as_str())?
        .set_default(GooseDefault::Timeout, "15")?
        .set_default(GooseDefault::NoTelnet, true)?
        .set_default(GooseDefault::NoWebSocket, true)?
        .set_default(GooseDefault::ReportFile, html_report_s.as_str())?;
    if profile() == "load" {
        let users = parse_usize(&env_or("LOAD_VUS", "10"), 10);
        let ramp = parse_usize(&env_or("LOAD_RAMP_SECONDS", "10"), 10);
        let hold = parse_usize(&env_or("LOAD_DURING_SECONDS", "60"), 60);
        let run_time = hold;
        let hatch = if ramp == 0 {
            users.to_string()
        } else {
            let rate = users as f64 / ramp as f64;
            if (rate - rate.round()).abs() < 1e-9 {
                format!("{}", rate.round() as u32)
            } else {
                format!("{rate:.1}")
            }
        };
        eprintln!(
            "goose host={host} profile=load users={users} hatch-rate={hatch}/s hold={run_time}s jsonl={} html={}",
            jsonl_path().display(),
            html_report.display()
        );
        attack = attack
            .set_default(GooseDefault::Users, users)?
            .set_default(GooseDefault::HatchRate, hatch.as_str())?
            .set_default(GooseDefault::RunTime, run_time)?;
    } else {
        eprintln!(
            "goose host={host} profile=smoke users=1 run-time=30s jsonl={} html={}",
            jsonl_path().display(),
            html_report.display()
        );
        attack = attack
            .set_default(GooseDefault::Users, 1usize)?
            .set_default(GooseDefault::HatchRate, "1")?
            .set_default(GooseDefault::RunTime, 30usize)?;
    }
    attack.execute().await?;
    Ok(())
}
