# syntax=docker/dockerfile:1.7
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /workspace
COPY backend/gradlew backend/gradlew.bat backend/build.gradle.kts backend/settings.gradle.kts backend/gradle.properties ./
COPY backend/gradle ./gradle
RUN chmod +x gradlew
COPY backend/src ./src
COPY front/public/perkhaven-logo.png /front/public/perkhaven-logo.png
RUN ./gradlew clean bootJar --no-daemon

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S perkhaven && adduser -S perkhaven -G perkhaven
WORKDIR /app
COPY --from=build /workspace/build/libs/perkhaven-backend-*.jar app.jar
USER perkhaven
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-Djava.security.egd=file:/dev/urandom", "-jar", "/app/app.jar"]
