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

    let api_addr = format!("0.0.0.0:{}", config.server_port);
    let api_listener = tokio::net::TcpListener::bind(&api_addr)
        .await
        .unwrap_or_else(|err| {
            tracing::error!("{}: bind {api_addr}: {err}", config.service_name);
            std::process::exit(1);
        });

    let management_addr = format!("0.0.0.0:{}", config.management_port);
    let management_listener = tokio::net::TcpListener::bind(&management_addr)
        .await
        .unwrap_or_else(|err| {
            tracing::error!("{}: bind {management_addr}: {err}", config.service_name);
            std::process::exit(1);
        });

    tracing::info!("{} listening on {api_addr}", config.service_name);
    tracing::info!("{} management on {management_addr}", config.service_name);
    tokio::select! {
        err = backend_rust_axum::run(state, api_listener) => {
            if let Err(err) = err {
                tracing::error!("{}: {err}", config.service_name);
                std::process::exit(1);
            }
        }
        err = axum::serve(
            management_listener,
            backend_rust_axum::management_router(),
        ) => {
            if let Err(err) = err {
                tracing::error!("{}: {err}", config.service_name);
                std::process::exit(1);
            }
        }
    }
}
