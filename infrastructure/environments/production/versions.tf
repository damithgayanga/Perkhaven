terraform {
  required_version = ">= 1.10.0"

  backend "s3" {
    key          = "perkhaven/production/terraform.tfstate"
    encrypt      = true
    use_lockfile = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.7"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.7"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = local.common_tags
  }
}

data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}
data "aws_region" "current" {}
data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  name = "${var.application_name}-${var.environment}"
  common_tags = {
    Application = var.application_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
  availability_zones = slice(data.aws_availability_zones.available.names, 0, 2)
}
