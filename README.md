# Perkhaven

Perkhaven is being migrated from a frontend prototype to a locally verifiable Spring Boot backend and,
in a later phase, AWS infrastructure.

```text
perkhaven/
├── front/          Existing frontend prototype
├── backend/        Spring Boot API (Gradle with Kotlin DSL, Java 21)
└── infrastructure/ Deferred AWS/Terraform phase
```

Checkpoint 1 is implemented under [`backend`](backend/README.md). Run it directly on the host; Docker
Compose is not required. The production [`Dockerfile`](backend/Dockerfile) is retained for the later ECS
Fargate build and deployment pipeline.

The existing frontend has only been relocated to `front/`. Its API/authentication refactor belongs to the
later frontend-integration checkpoint.
