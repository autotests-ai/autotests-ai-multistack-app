# Build context: repository root (see docker-compose.yml).
# Packs the active UI module into Spring static. Paths come from build-args —
# this file must not name a frontend stack (vanilla / react / …).
ARG UI_MODULE
ARG UI_RUNTIME

FROM eclipse-temurin:21-jdk-alpine AS build
ARG UI_MODULE
ARG UI_RUNTIME
WORKDIR /repo

COPY ${UI_RUNTIME} /tmp/ui-runtime
COPY ${UI_MODULE} /tmp/ui
COPY backend/java/backend_java_spring backend/java/backend_java_spring

RUN test -n "$UI_MODULE" && test -n "$UI_RUNTIME" \
  && STATIC=backend/java/backend_java_spring/src/main/resources/static \
  && rm -rf "$STATIC" \
  && mkdir -p "$STATIC" \
  && cp -a /tmp/ui-runtime/. "$STATIC/" \
  && cp -a /tmp/ui/. "$STATIC/" \
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
