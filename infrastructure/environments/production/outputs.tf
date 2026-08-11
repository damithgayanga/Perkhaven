output "ecr_repository_url" {
  value = data.aws_ecr_repository.backend.repository_url
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  value = aws_ecs_service.backend.name
}

output "ecs_task_definition_arn" {
  value = aws_ecs_task_definition.backend.arn
}

output "ecs_subnet_ids" {
  value = [for subnet in aws_subnet.public : subnet.id]
}

output "ecs_security_group_id" {
  value = aws_security_group.backend.id
}

output "frontend_bucket_name" {
  value = aws_s3_bucket.frontend.id
}

output "documents_bucket_name" {
  value = aws_s3_bucket.documents.id
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.main.id
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.main.domain_name
}

output "application_url" {
  value = local.application_public_url
}

output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.main.id
}

output "cognito_client_id" {
  value = aws_cognito_user_pool_client.frontend.id
}

output "cognito_issuer" {
  value = "https://cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.main.id}"
}

output "cognito_hosted_ui_domain" {
  value = "https://${aws_cognito_user_pool_domain.main.domain}.auth.${var.aws_region}.amazoncognito.com"
}

output "route53_name_servers" {
  description = "Set these at the registrar when Terraform created the hosted zone and the domain is registered elsewhere."
  value       = var.enable_custom_domain && var.create_route53_zone ? aws_route53_zone.main[0].name_servers : []
}

output "database_secret_arn" {
  value     = aws_db_instance.postgres.master_user_secret[0].secret_arn
  sensitive = true
}
