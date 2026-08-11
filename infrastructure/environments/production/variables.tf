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

variable "create_route53_zone" {
  description = "Create a public Route 53 hosted zone. Set false and provide route53_zone_id to reuse an existing zone."
  type        = bool
  default     = true
}

variable "route53_zone_id" {
  description = "Existing hosted zone ID when create_route53_zone is false."
  type        = string
  default     = null

  validation {
    condition     = var.create_route53_zone || var.route53_zone_id != null
    error_message = "route53_zone_id is required when create_route53_zone is false."
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

variable "database_deletion_protection" {
  type    = bool
  default = true
}

variable "database_skip_final_snapshot" {
  description = "Keep false in production. Set true only for disposable test accounts."
  type        = bool
  default     = false
}

variable "alert_email" {
  description = "Optional email address for CloudWatch alarm notifications. Subscription confirmation is required by AWS."
  type        = string
  default     = null
}
