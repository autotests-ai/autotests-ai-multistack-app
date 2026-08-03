# Build context: repository root (see docker-compose.yml).
# Packs frontend/ into Spring static for a single deployable jar — no sync scripts.
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /repo

COPY frontend/_shared/frontend_javascript_app /tmp/ui-app
COPY frontend/javascript/vanilla/frontend_javascript_vanilla /tmp/ui-vanilla
COPY backend/java/backend_java_spring backend/java/backend_java_spring

RUN STATIC=backend/java/backend_java_spring/src/main/resources/static \
  && rm -rf "$STATIC" \
  && mkdir -p "$STATIC" \
  && cp -a /tmp/ui-app/. "$STATIC/" \
  && cp -a /tmp/ui-vanilla/. "$STATIC/" \
  && rm -f "$STATIC/README.md"

WORKDIR /repo/backend/java/backend_java_spring
RUN chmod +x gradlew && ./gradlew bootJar --no-daemon

FROM eclipse-temurin:21-jre-alpine
RUN apk add --no-cache wget
WORKDIR /app
COPY --from=build /repo/backend/java/backend_java_spring/build/libs/*.jar app.jar
ENV SERVER_PORT=8080
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
