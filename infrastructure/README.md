# Infrastructure — Deferred

Infrastructure is intentionally deferred until the local Spring Boot backend is complete and accepted.
No Terraform configuration or AWS resources are created in Checkpoint 1.

The later phase will target AWS Mumbai (`ap-south-1`) with ECS Fargate, RDS PostgreSQL, Cognito, SES,
private S3 storage, CloudFront, Route 53, ACM, Secrets Manager and CloudWatch.
