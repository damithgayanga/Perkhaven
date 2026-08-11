variable "application_name" {
  type    = string
  default = "perkhaven"
}

variable "environment" {
  type    = string
  default = "production"
}

variable "aws_region" {
  type    = string
  default = "ap-south-1"
}

variable "domain_name" {
  type    = string
  default = "perkhaven.com"
}

variable "enable_custom_domain" {
  description = "Enable Route 53 records and an ACM certificate for domain_name. Leave false to use the CloudFront HTTPS hostname."
  type        = bool
  default     = false
}

variable "enable_ses_domain" {
  description = "Enable SES domain identity and DNS records after the custom domain is registered."
  type        = bool
  default     = false

  validation {
    condition     = !var.enable_ses_domain || var.enable_custom_domain
    error_message = "enable_ses_domain requires enable_custom_domain to be true."
  }
}

variable "create_route53_zone" {
  description = "Create a public Route 53 hosted zone. Set false and provide route53_zone_id to reuse an existing zone."
  type        = bool
  default     = true
}

variable "route53_zone_id" {
  description = "Existing hosted zone ID when custom-domain support is enabled and create_route53_zone is false."
  type        = string
  default     = null

  validation {
    condition     = !var.enable_custom_domain || var.create_route53_zone || try(trimspace(var.route53_zone_id) != "", false)
    error_message = "route53_zone_id is required when custom-domain support is enabled without creating a zone."
  }
}

variable "vpc_cidr" {
  type    = string
  default = "10.20.0.0/16"
}

variable "backend_image_uri" {
  description = "Immutable ECR image URI, normally supplied by GitHub Actions using the commit SHA."
  type        = string
}

variable "ecr_repository_name" {
  type    = string
  default = "perkhaven-backend"
}

variable "ecs_cpu" {
  type    = number
  default = 512
}

variable "ecs_memory" {
  type    = number
  default = 1024
}

variable "ecs_desired_count" {
  description = "Recorded baseline only. GitHub Actions scales the service after migrations and Terraform ignores subsequent desired-count changes."
  type        = number
  default     = 0
}

variable "database_instance_class" {
  type    = string
  default = "db.t4g.micro"
}

variable "database_allocated_storage" {
  type    = number
  default = 20
}

variable "database_max_allocated_storage" {
  type    = number
  default = 100
}

variable "database_backup_retention_days" {
  description = "Automated RDS backup retention in days. The initial AWS Free Plan deployment uses 1; increase this after upgrading the account plan."
  type        = number
  default     = 1

  validation {
    condition     = var.database_backup_retention_days >= 0 && var.database_backup_retention_days <= 35 && floor(var.database_backup_retention_days) == var.database_backup_retention_days
    error_message = "database_backup_retention_days must be a whole number from 0 through 35."
  }
}

variable "database_deletion_protection" {
  type    = bool
  default = true
}

variable "database_skip_final_snapshot" {
  description = "Keep false in production. Set true only for disposable test accounts."
  type        = bool
  default     = false
}

variable "initial_admin_email" {
  description = "Email address Cognito should invite and manage as the first production administrator. Keep this repository variable set after creation."
  type        = string
  default     = ""

  validation {
    condition     = trimspace(var.initial_admin_email) == "" || can(regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$", trimspace(var.initial_admin_email)))
    error_message = "initial_admin_email must be empty or a valid email address."
  }
}

variable "alert_email" {
  description = "Optional email address for CloudWatch alarm notifications. Subscription confirmation is required by AWS."
  type        = string
  default     = null
}
