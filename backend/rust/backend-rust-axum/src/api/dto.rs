use serde::Serialize;

#[derive(Serialize)]
pub struct HealthResponse {
    pub status: &'static str,
    pub service: String,
}

#[derive(Serialize)]
pub struct ItemDto {
    pub id: i64,
    pub name: String,
    pub description: String,
}

#[derive(Serialize)]
pub struct ItemsResponse {
    pub items: Vec<ItemDto>,
    pub source: &'static str,
}

#[derive(Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub username: String,
    #[serde(rename = "redirectUrl")]
    pub redirect_url: &'static str,
}

#[derive(Serialize)]
pub struct ProfileResponse {
    pub username: String,
}

#[derive(Serialize)]
pub struct ErrorResponse {
    pub message: String,
}
