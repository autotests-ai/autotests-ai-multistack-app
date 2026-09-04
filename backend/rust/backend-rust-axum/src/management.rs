use std::sync::OnceLock;
use std::time::Instant;

use axum::extract::Request;
use axum::http::{header, StatusCode};
use axum::middleware::Next;
use axum::response::{IntoResponse, Response};
use axum::routing::get;
use axum::{Json, Router};
use prometheus::{Encoder, HistogramVec, TextEncoder};
use serde::Serialize;

static HTTP_SERVER_REQUESTS: OnceLock<HistogramVec> = OnceLock::new();

fn http_server_requests() -> &'static HistogramVec {
    HTTP_SERVER_REQUESTS.get_or_init(|| {
        prometheus::register_histogram_vec!(
            "http_server_requests_seconds",
            "HTTP request duration in seconds",
            &["method", "uri", "status"]
        )
        .expect("register http_server_requests_seconds")
    })
}

#[derive(Serialize)]
struct ActuatorHealth {
    status: &'static str,
}

pub fn management_router() -> Router {
    Router::new()
        .route("/actuator/health", get(health))
        .route("/actuator/prometheus", get(prometheus_scrape))
}

async fn health() -> Json<ActuatorHealth> {
    Json(ActuatorHealth { status: "UP" })
}

async fn prometheus_scrape() -> impl IntoResponse {
    let encoder = TextEncoder::new();
    let mut buffer = Vec::new();
    encoder
        .encode(&prometheus::gather(), &mut buffer)
        .expect("encode prometheus scrape");
    (
        StatusCode::OK,
        [(header::CONTENT_TYPE, encoder.format_type().to_string())],
        buffer,
    )
}

pub async fn observe_middleware(request: Request, next: Next) -> Response {
    let method = request.method().as_str().to_owned();
    let uri = request.uri().path().to_owned();
    let started = Instant::now();
    let response = next.run(request).await;
    let status = response.status().as_u16().to_string();
    http_server_requests()
        .with_label_values(&[&method, &uri, &status])
        .observe(started.elapsed().as_secs_f64());
    response
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;
    use std::time::Duration;

    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use http_body_util::BodyExt;
    use tower::ServiceExt;

    use super::*;
    use crate::api::test_router;
    use crate::security::TokenService;
    use crate::store::FakeStore;

    async fn body_string(response: axum::response::Response) -> String {
        let bytes = response.into_body().collect().await.unwrap().to_bytes();
        String::from_utf8(bytes.to_vec()).unwrap()
    }

    fn api_router() -> Router {
        test_router(
            Arc::new(FakeStore::new()) as Arc<dyn crate::store::Store>,
            Arc::new(TokenService::new(
                "multistack-dev-secret-change-in-production-min-32-chars".to_string(),
                Duration::from_secs(3600),
            )),
        )
    }

    #[tokio::test]
    async fn health_on_management_port() {
        let response = management_router()
            .oneshot(
                Request::builder()
                    .uri("/actuator/health")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        let body = body_string(response).await;
        assert!(body.contains("UP"), "{body}");
    }

    #[tokio::test]
    async fn prometheus_on_api_port_is_not_ok() {
        let response = api_router()
            .oneshot(
                Request::builder()
                    .uri("/actuator/prometheus")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_ne!(response.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn prometheus_scrape_after_api_call() {
        let api_response = api_router()
            .oneshot(
                Request::builder()
                    .uri("/api/health")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(api_response.status(), StatusCode::OK);

        let scrape = management_router()
            .oneshot(
                Request::builder()
                    .uri("/actuator/prometheus")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(scrape.status(), StatusCode::OK);
        let body = body_string(scrape).await;
        assert!(body.contains("http_server_requests_seconds"), "{body}");
        assert!(body.contains("method=\"GET\""), "{body}");
        assert!(body.contains("uri=\"/api/health\""), "{body}");
        assert!(body.contains("status=\"200\""), "{body}");
    }
}
