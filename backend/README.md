# Perkhaven Backend

Checkpoint 1 of the Perkhaven Spring Boot backend. It provides local H2 persistence, Flyway migrations,
local JWT authentication, audit logging, local student-photo storage and APIs for users, permissions,
students, rooms, staff, designations, shops and shop tenants.

## Requirements

- Java 21
- No local Gradle installation is needed; use the checked-in wrapper.
- Docker is optional and is only needed to run the PostgreSQL compatibility test or build the production image.

## Run locally

```bash
cd backend
./gradlew bootRun
```

If macOS cannot discover a Homebrew JDK, set `JAVA_HOME` first:

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
./gradlew bootRun
```

The local service listens on `http://localhost:8080`.

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/api-docs`
- H2 console: `http://localhost:8080/h2-console`
- JDBC URL: `jdbc:h2:file:./data/perkhaven`
- Username: `sa`; password is blank.

Use `POST /api/v1/local-auth/token` with one of the local demo accounts. For example:

```json
{"username":"admin@perkhaven.demo","password":"PerkAdmin#2026"}
```

## Test and package

```bash
./gradlew test
./gradlew bootJar
```

Without Docker, the PostgreSQL Testcontainers test is skipped automatically. The H2 integration and
authorization tests still run. The production Dockerfile is intended for the later ECS build pipeline.
