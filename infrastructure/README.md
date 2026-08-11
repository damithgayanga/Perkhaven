# Perkhaven AWS infrastructure

Terraform provisions Perkhaven in AWS Mumbai (`ap-south-1`). No resource is created merely by committing
these files. GitHub Actions performs normal plans and deployments after the one-time bootstrap.

## Architecture

- Route 53 hosts `perkhaven.com` and `www.perkhaven.com`.
- CloudFront is the only public application URL. Its default origin is a private S3 frontend bucket.
- `/api/*` and `/actuator/health*` route to an HTTPS Application Load Balancer origin.
- The ALB requires a secret CloudFront origin header before forwarding traffic to ECS.
- The Spring Boot container runs on ECS Fargate across two public subnets. It has a public IP for outbound
  AWS/API access, but its security group accepts port 8080 only from the ALB.
- RDS PostgreSQL is in isolated database subnets and accepts traffic only from the backend security group.
- Application documents use a separate private, encrypted and versioned S3 bucket.
- Cognito supplies user accounts and role groups. SES supplies domain-verified outbound email.
- Secrets Manager owns the RDS password and CloudFront-to-ALB origin secret.
- CloudWatch retains backend logs and monitors ALB failures, unhealthy targets and RDS CPU.

This layout intentionally has no NAT Gateway, which avoids a large fixed monthly cost. It can be changed to
private application subnets plus VPC endpoints or NAT when stricter network isolation justifies the cost.

## One-time bootstrap

GitHub cannot create its own AWS trust relationship. Run `bootstrap` once with administrator credentials in
a dedicated Perkhaven AWS account:

```bash
cd infrastructure/bootstrap
terraform init
terraform apply
terraform output
```

If the AWS account already has the GitHub OIDC provider, copy `terraform.tfvars.example` to an ignored
`terraform.tfvars`, set `create_github_oidc_provider = false`, and provide its ARN.

The bootstrap creates:

- versioned and encrypted Terraform state bucket;
- GitHub OIDC provider and production/plan IAM roles;
- immutable ECR repository, needed before the main infrastructure exists.

Create a GitHub environment named `production`, restrict it to `main`, and do not add required reviewers for
zero-touch deployments. Add these repository or environment variables using the bootstrap outputs:

| Variable | Value |
| --- | --- |
| `AWS_REGION` | `ap-south-1` |
| `AWS_ACCOUNT_ID` | `890839646565` |
| `TF_STATE_BUCKET` | `state_bucket_name` output |
| `AWS_TERRAFORM_ROLE_ARN` | `terraform_role_arn` output |
| `AWS_PLAN_ROLE_ARN` | `plan_role_arn` output |
| `AWS_DEPLOY_ROLE_ARN` | `deploy_role_arn` output |
| `DOMAIN_NAME` | `perkhaven.com` |
| `CREATE_ROUTE53_ZONE` | `true`, or `false` when reusing a zone |
| `ROUTE53_ZONE_ID` | Existing zone ID when the preceding value is `false` |

No AWS access key or database password belongs in GitHub.

## DNS prerequisite

By default Terraform creates a Route 53 hosted zone. If `perkhaven.com` is registered outside Route 53, its
registrar name servers must be changed once to the `route53_name_servers` output before ACM validation can
complete. If a hosted zone already exists, set `create_route53_zone = false` and provide `route53_zone_id`.

## Automated releases

`.github/workflows/pull-request.yml` tests the backend, frontend, container and Terraform. It creates a
read-only Terraform plan after bootstrap variables exist.

`.github/workflows/deploy-production.yml` runs after every push to `main`:

1. test the backend and static frontend;
2. build an ARM64 image tagged with the immutable Git commit SHA and push it to ECR;
3. apply Terraform using S3 native state locking;
4. run Flyway as a one-off Fargate task and stop if it fails;
5. update and scale the ECS service, waiting for stability;
6. upload `front/out` to S3 and invalidate CloudFront;
7. smoke-test the public website and backend health endpoint.

ECS has a deployment circuit breaker with automatic rollback. Database migrations remain forward-only and
must be backward compatible with the previously running application revision.

## Production Terraform

For diagnostic use outside GitHub:

```bash
cd infrastructure/environments/production
terraform init \
  -backend-config="bucket=perkhaven-terraform-state-ACCOUNT_ID" \
  -backend-config="region=ap-south-1"
terraform plan \
  -var="backend_image_uri=ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/perkhaven-backend:sha-COMMIT"
```

The RDS resource has both deletion protection and Terraform `prevent_destroy`. Do not disable both during a
normal deployment. SES accounts start in the AWS sandbox; requesting production email access is an AWS
account-level prerequisite and is not bypassed by Terraform.

## Remaining application dependencies

Infrastructure is deployable independently, but a useful production release still depends on completing the
frontend `/api/v1` and Cognito login integration and the backend SES workflows described in the application
checkpoints. The pipeline will stop rather than silently publish an unhealthy backend.
