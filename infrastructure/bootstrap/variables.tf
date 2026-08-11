variable "aws_region" {
  description = "AWS region used for the state bucket and ECR repository."
  type        = string
  default     = "ap-south-1"
}

variable "github_owner" {
  description = "GitHub organization or user that owns the repository."
  type        = string
  default     = "damithgayanga"
}

variable "github_owner_id" {
  description = "Numeric GitHub owner ID included in the repository's customized OIDC subject."
  type        = string
}

variable "github_repository" {
  description = "GitHub repository name."
  type        = string
  default     = "Perkhaven"
}

variable "github_repository_id" {
  description = "Numeric GitHub repository ID included in the customized OIDC subject."
  type        = string
}

variable "production_environment" {
  description = "GitHub environment allowed to perform production deployments."
  type        = string
  default     = "production"
}

variable "domain_name" {
  description = "Public domain to create or locate in Route 53 during bootstrap."
  type        = string
  default     = "perkhaven.com"
}

variable "existing_route53_zone_id" {
  description = "Existing Route 53 hosted zone ID. Leave null or empty to create the zone in bootstrap."
  type        = string
  default     = null
}

variable "state_bucket_name" {
  description = "Optional globally unique state bucket name. A deterministic account-scoped name is used when null."
  type        = string
  default     = null
}

variable "create_github_oidc_provider" {
  description = "Set false when the AWS account already has GitHub's OIDC provider."
  type        = bool
  default     = true
}

variable "existing_github_oidc_provider_arn" {
  description = "Existing GitHub OIDC provider ARN when create_github_oidc_provider is false."
  type        = string
  default     = null

  validation {
    condition     = var.create_github_oidc_provider || var.existing_github_oidc_provider_arn != null
    error_message = "existing_github_oidc_provider_arn is required when create_github_oidc_provider is false."
  }
}
