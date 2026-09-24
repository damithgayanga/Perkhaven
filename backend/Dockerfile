# syntax=docker/dockerfile:1.7
FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace
COPY backend/gradlew backend/gradlew.bat backend/build.gradle.kts backend/settings.gradle.kts backend/gradle.properties ./
COPY backend/gradle ./gradle
RUN chmod +x gradlew
COPY backend/src ./src
COPY front/public/perkhaven-logo.png /front/public/perkhaven-logo.png
COPY front/public/agreement-template /front/public/agreement-template
RUN ./gradlew clean bootJar --no-daemon

# Playwright's pinned image supplies Chromium and all native browser
# dependencies for both linux/amd64 and linux/arm64. Production ECS builds
# target linux/arm64, so the previous Alpine runtime cannot host Chromium.
FROM mcr.microsoft.com/playwright/java:v1.63.0-noble
USER root
RUN apt-get update \
    && apt-get install -y --no-install-recommends openjdk-21-jre-headless \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system perkhaven \
    && useradd --system --gid perkhaven --create-home perkhaven
WORKDIR /app
COPY --from=build /workspace/build/libs/perkhaven-backend-*.jar app.jar
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
USER perkhaven
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=60", "-Djava.security.egd=file:/dev/urandom", "-jar", "/app/app.jar"]
