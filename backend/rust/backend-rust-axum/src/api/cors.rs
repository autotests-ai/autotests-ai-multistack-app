use axum::body::Body;
use axum::http::{header, HeaderMap, HeaderValue, Method, Request, StatusCode};
use axum::middleware::Next;
use axum::response::Response;

const ALLOWED_METHODS: &str = "GET, POST, PUT, PATCH, DELETE, OPTIONS";
const EXPOSED_HEADERS: &str = "Authorization";
const MAX_AGE: &str = "600";

/// Same contract as backend-go-gin: every origin, no credentials, Authorization exposed.
/// Mounted only on the `/api` router, so every request here is in-contract.
pub async fn middleware(req: Request<Body>, next: Next) -> Response {
    let requested = req
        .headers()
        .get(header::ACCESS_CONTROL_REQUEST_HEADERS)
        .cloned()
        .unwrap_or_else(|| HeaderValue::from_static("*"));
    if req.method() == Method::OPTIONS {
        let mut response = Response::new(Body::empty());
        *response.status_mut() = StatusCode::NO_CONTENT;
        apply_cors(response.headers_mut(), requested);
        return response;
    }

    let mut response = next.run(req).await;
    apply_cors(response.headers_mut(), requested);
    response
}

fn apply_cors(headers: &mut HeaderMap, allow_headers: HeaderValue) {
    headers.insert(
        header::ACCESS_CONTROL_ALLOW_ORIGIN,
        HeaderValue::from_static("*"),
    );
    headers.insert(
        header::ACCESS_CONTROL_ALLOW_METHODS,
        HeaderValue::from_static(ALLOWED_METHODS),
    );
    headers.insert(
        header::ACCESS_CONTROL_EXPOSE_HEADERS,
        HeaderValue::from_static(EXPOSED_HEADERS),
    );
    headers.insert(
        header::ACCESS_CONTROL_MAX_AGE,
        HeaderValue::from_static(MAX_AGE),
    );
    headers.insert(header::ACCESS_CONTROL_ALLOW_HEADERS, allow_headers);
    headers.append(header::VARY, HeaderValue::from_static("Origin"));
    headers.append(
        header::VARY,
        HeaderValue::from_static("Access-Control-Request-Headers"),
    );
}
