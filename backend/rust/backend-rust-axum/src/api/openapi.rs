use axum::response::{Html, IntoResponse, Response};
use axum::http::header;

const OPENAPI_YAML: &str = include_str!("../../resources/openapi.yaml");
const OPENAPI_DOCS: &str = include_str!("../../resources/openapi-docs.html");

pub async fn spec() -> Response {
    (
        [(header::CONTENT_TYPE, "application/yaml")],
        OPENAPI_YAML,
    )
        .into_response()
}

pub async fn docs() -> Html<&'static str> {
    Html(OPENAPI_DOCS)
}
