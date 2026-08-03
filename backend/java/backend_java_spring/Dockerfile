# Build context: repository root (see docker-compose.yml).
FROM eclipse-temurin:21-jdk-alpine AS build
RUN apk add --no-cache bash rsync
WORKDIR /repo

COPY backend/scripts backend/scripts
COPY frontend/_shared/frontend_javascript_app frontend/_shared/frontend_javascript_app
COPY frontend/javascript/vanilla/frontend_javascript_vanilla frontend/javascript/vanilla/frontend_javascript_vanilla
COPY backend/java/backend_java_spring backend/java/backend_java_spring

RUN bash backend/scripts/sync-app-static.sh

WORKDIR /repo/backend/java/backend_java_spring
RUN chmod +x gradlew && ./gradlew bootJar --no-daemon

FROM eclipse-temurin:21-jre-alpine
RUN apk add --no-cache wget
WORKDIR /app
COPY --from=build /repo/backend/java/backend_java_spring/build/libs/*.jar app.jar
ENV SERVER_PORT=8080
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
