FROM rust:1.88-alpine3.21 AS build
RUN apk add --no-cache musl-dev pkgconfig openssl-dev
WORKDIR /src
COPY Cargo.toml Cargo.lock ./
COPY src ./src
COPY resources ./resources
COPY schema.sql ./schema.sql
RUN cargo build --release

FROM alpine:3.21
RUN apk add --no-cache ca-certificates wget \
    && addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build /src/target/release/backend-rust-axum ./backend-rust-axum
COPY schema.sql ./schema.sql
USER app
ENV SERVER_PORT=8080
ENV MANAGEMENT_PORT=8081
EXPOSE 8080 8081
HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=3 \
    CMD wget -qO- "http://127.0.0.1:${SERVER_PORT}/api/health" >/dev/null || exit 1
CMD ["./backend-rust-axum"]
