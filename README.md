# Perkhaven

Perkhaven is being migrated from a frontend prototype to a Spring Boot backend with automated AWS delivery.

```text
perkhaven/
├── front/          Existing frontend prototype
├── backend/        Spring Boot API (Gradle with Kotlin DSL, Java 21)
└── infrastructure/ Terraform for AWS and GitHub OIDC deployment
```

Checkpoint 1 is implemented under [`backend`](backend/README.md). Run it directly on the host; Docker
Compose is not required. The production [`Dockerfile`](backend/Dockerfile) is built by GitHub Actions for
ECS Fargate.

AWS infrastructure and pipeline bootstrap instructions are in [`infrastructure`](infrastructure/README.md).
The frontend `/api/v1` and Cognito integration and later backend checkpoints remain application work.
