use std::future::Future;
use std::net::TcpListener;
use std::time::Duration;

use serde_json::json;
use thirtyfour::{CapabilitiesHelper, ChromiumLikeCapabilities, DesiredCapabilities, WebDriver};
use tokio::sync::Mutex;

use crate::config::{load_config, must_base_url, TestConfig};
use crate::local_chrome_pin;

const SESSION_ATTEMPTS: u32 = 3;
const SESSION_RETRY_DELAY: Duration = Duration::from_millis(3000);

struct LiveSession {
    driver: WebDriver,
    chromedriver: Option<tokio::process::Child>,
}

static SESSION: Mutex<Option<LiveSession>> = Mutex::const_new(None);

pub fn require_chrome(config: &TestConfig) -> Result<(), String> {
    let browser = config.browser.trim().to_ascii_lowercase();
    if browser != "chrome" && browser != "chromium" {
        return Err(format!(
            "This Selenium cell is Chrome-only: local Chrome for Testing, \
             or Selenoid chrome. Got browser={}",
            config.browser
        ));
    }
    Ok(())
}

pub async fn has_session() -> bool {
    SESSION.lock().await.is_some()
}

pub async fn driver() -> WebDriver {
    SESSION
        .lock()
        .await
        .as_ref()
        .expect("WebDriver is not started")
        .driver
        .clone()
}

pub async fn start_blank() {
    if has_session().await {
        return;
    }
    start().await;
    driver()
        .await
        .goto("about:blank")
        .await
        .expect("about:blank");
}

pub async fn ensure_session() {
    if has_session().await {
        return;
    }
    let mut last_error = String::new();
    for attempt in 1..=SESSION_ATTEMPTS {
        match start_inner().await {
            Ok(()) => {
                driver()
                    .await
                    .goto(must_base_url())
                    .await
                    .unwrap_or_else(|err| panic!("open baseUrl: {err}"));
                return;
            }
            Err(err) if is_session_create_failure(&err) && attempt < SESSION_ATTEMPTS => {
                last_error = err;
                quit().await;
                tokio::time::sleep(SESSION_RETRY_DELAY).await;
            }
            Err(err) => panic!("{err}"),
        }
    }
    panic!("{last_error}");
}

pub async fn start() {
    if has_session().await {
        return;
    }
    start_inner().await.unwrap_or_else(|err| panic!("{err}"));
}

async fn start_inner() -> Result<(), String> {
    let config = load_config();
    require_chrome(&config)?;
    let (driver, chromedriver) = create(&config).await?;
    apply_window_size(&driver, &config).await;
    *SESSION.lock().await = Some(LiveSession {
        driver,
        chromedriver,
    });
    Ok(())
}

pub async fn quit() {
    let session = SESSION.lock().await.take();
    let Some(session) = session else {
        return;
    };
    let _ = session.driver.quit().await;
    drop(session.chromedriver);
}

/// Start a browser session, run `f`, then quit when `closeBrowserAfterEach` is true.
pub async fn with_browser<F, Fut>(f: F)
where
    F: FnOnce() -> Fut,
    Fut: Future<Output = ()>,
{
    let config = load_config();
    if !config.skip_blank_open {
        ensure_session().await;
    }
    f().await;
    if load_config().close_browser_after_each {
        quit().await;
    }
}

async fn create(
    config: &TestConfig,
) -> Result<(WebDriver, Option<tokio::process::Child>), String> {
    let remote = config.remote_url.trim();
    let local = remote.is_empty();
    let caps = chrome_options(config, local)?;
    if !local {
        let driver = WebDriver::new(remote, caps)
            .await
            .map_err(|err| err.to_string())?;
        return Ok((driver, None));
    }

    let pin = local_chrome_pin::resolve(&config.browser_version)?;
    let mut caps = caps;
    caps.set_binary(pin.chrome.to_str().ok_or("chrome binary path")?)
        .map_err(|err| err.to_string())?;
    let port = free_port()?;
    let child = spawn_chromedriver(&pin.driver, port).await?;
    wait_for_chromedriver(port).await?;
    let server = format!("http://127.0.0.1:{port}");
    let driver = WebDriver::new(&server, caps)
        .await
        .map_err(|err| err.to_string())?;
    Ok((driver, Some(child)))
}

fn chrome_options(config: &TestConfig, local: bool) -> Result<thirtyfour::ChromeCapabilities, String> {
    let mut options = DesiredCapabilities::chrome();
    if config.headless {
        options
            .add_arg("--headless=new")
            .and_then(|_| options.add_arg("--disable-gpu"))
            .and_then(|_| options.add_arg("--no-sandbox"))
            .and_then(|_| options.add_arg("--disable-dev-shm-usage"))
            .map_err(|err| err.to_string())?;
    } else if local {
        options
            .add_arg("--disable-gpu")
            .and_then(|_| options.add_arg("--no-sandbox"))
            .and_then(|_| options.add_arg("--disable-dev-shm-usage"))
            .map_err(|err| err.to_string())?;
    }
    if !local {
        options
            .set_base_capability("browserVersion", &config.browser_version)
            .map_err(|err| err.to_string())?;
        options
            .set_base_capability(
                "selenoid:options",
                json!({
                    "enableVNC": config.enable_vnc,
                    "enableVideo": config.enable_video,
                }),
            )
            .map_err(|err| err.to_string())?;
    }
    Ok(options)
}

async fn apply_window_size(driver: &WebDriver, config: &TestConfig) {
    let Some((width, height)) = parse_browser_size(&config.browser_size) else {
        return;
    };
    driver
        .set_window_rect(0, 0, width, height)
        .await
        .unwrap_or_else(|err| panic!("window size: {err}"));
    driver
        .set_implicit_wait_timeout(Duration::ZERO)
        .await
        .unwrap_or_else(|err| panic!("implicit wait: {err}"));
}

pub fn parse_browser_size(browser_size: &str) -> Option<(u32, u32)> {
    let mut parts = browser_size.split('x');
    let width = parts.next()?.trim().parse().ok()?;
    let height = parts.next()?.trim().parse().ok()?;
    if parts.next().is_some() {
        return None;
    }
    Some((width, height))
}

fn is_session_create_failure(error: &str) -> bool {
    let lower = error.to_ascii_lowercase();
    lower.contains("session") || lower.contains("chrome not reachable")
}

fn free_port() -> Result<u16, String> {
    let listener = TcpListener::bind("127.0.0.1:0").map_err(|err| err.to_string())?;
    let port = listener.local_addr().map_err(|err| err.to_string())?.port();
    drop(listener);
    Ok(port)
}

async fn spawn_chromedriver(
    driver: &std::path::Path,
    port: u16,
) -> Result<tokio::process::Child, String> {
    tokio::process::Command::new(driver)
        .arg(format!("--port={port}"))
        .arg("--allowed-ips=")
        .kill_on_drop(true)
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .spawn()
        .map_err(|err| format!("spawn chromedriver: {err}"))
}

async fn wait_for_chromedriver(port: u16) -> Result<(), String> {
    let url = format!("http://127.0.0.1:{port}/status");
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(1))
        .build()
        .map_err(|err| err.to_string())?;
    for _ in 0..50 {
        if client.get(&url).send().await.is_ok() {
            return Ok(());
        }
        tokio::time::sleep(Duration::from_millis(100)).await;
    }
    Err(format!("chromedriver did not become ready on port {port}"))
}
