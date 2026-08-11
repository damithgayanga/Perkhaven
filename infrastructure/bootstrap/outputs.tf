output "state_bucket_name" {
  value = aws_s3_bucket.terraform_state.id
}

output "ecr_repository_url" {
  value = aws_ecr_repository.backend.repository_url
}

output "terraform_role_arn" {
  value = aws_iam_role.terraform.arn
}

output "plan_role_arn" {
  value = aws_iam_role.plan.arn
}

output "deploy_role_arn" {
  value = aws_iam_role.deploy.arn
}

output "route53_zone_id" {
  value = local.route53_zone_id
}

output "route53_name_servers" {
  value = length(aws_route53_zone.main) == 1 ? aws_route53_zone.main[0].name_servers : []
}
