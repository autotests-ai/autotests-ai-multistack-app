use backend_rust_axum::config;
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env().add_directive("backend_rust_axum=info".parse().unwrap()))
        .init();

    let config = config::load();
    let state = match backend_rust_axum::bootstrap(&config).await {
        Ok(state) => state,
        Err(err) => {
            tracing::error!("{}: {err}", config.service_name);
            std::process::exit(1);
        }
    };

    let addr = format!("0.0.0.0:{}", config.server_port);
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .unwrap_or_else(|err| {
            tracing::error!("{}: bind {addr}: {err}", config.service_name);
            std::process::exit(1);
        });

    tracing::info!("{} listening on {addr}", config.service_name);
    if let Err(err) = backend_rust_axum::run(state, listener).await {
        tracing::error!("{}: {err}", config.service_name);
        std::process::exit(1);
    }
}
