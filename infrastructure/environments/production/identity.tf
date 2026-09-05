locals {
  application_public_url = "https://${var.enable_custom_domain ? var.domain_name : aws_cloudfront_distribution.main.domain_name}"
}

resource "aws_cognito_user_pool" "main" {
  name = local.name

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length                   = 12
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = true
    require_uppercase                = true
    temporary_password_validity_days = 7
  }

  admin_create_user_config {
    allow_admin_create_user_only = true
    invite_message_template {
      email_subject = "Your Perkhaven account"
      email_message = "Welcome to Perkhaven. Your registration username is {username} and your temporary password is {####}. Open ${local.application_public_url} to sign in and set your permanent password. This temporary password expires in 7 days."
      sms_message   = "Perkhaven username: {username}; temporary password: {####}"
    }
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  user_attribute_update_settings {
    attributes_require_verification_before_update = ["email"]
  }

  deletion_protection = "ACTIVE"
}

resource "aws_cognito_user_pool_client" "frontend" {
  name         = "${local.name}-frontend"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret                      = false
  prevent_user_existence_errors        = "ENABLED"
  enable_token_revocation              = true
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email", "profile"]
  supported_identity_providers         = ["COGNITO"]
  explicit_auth_flows                  = ["ALLOW_USER_PASSWORD_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]
  callback_urls                        = var.enable_custom_domain ? ["https://${var.domain_name}/", "https://www.${var.domain_name}/"] : ["${local.application_public_url}/"]
  logout_urls                          = var.enable_custom_domain ? ["https://${var.domain_name}/", "https://www.${var.domain_name}/"] : ["${local.application_public_url}/"]

  access_token_validity  = 60
  id_token_validity      = 60
  refresh_token_validity = 30
  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }
}

resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${local.name}-${data.aws_caller_identity.current.account_id}"
  user_pool_id = aws_cognito_user_pool.main.id
}

resource "aws_cognito_user_group" "roles" {
  for_each = {
    ADMIN             = 10
    CHAIRMAN          = 20
    MANAGING_DIRECTOR = 30
    WARDEN            = 40
    STAFF             = 50
    STUDENT           = 60
  }

  name         = each.key
  precedence   = each.value
  user_pool_id = aws_cognito_user_pool.main.id
}

resource "aws_cognito_user" "initial_admin" {
  count = trimspace(var.initial_admin_email) == "" ? 0 : 1

  user_pool_id             = aws_cognito_user_pool.main.id
  username                 = trimspace(var.initial_admin_email)
  desired_delivery_mediums = ["EMAIL"]

  attributes = {
    email              = trimspace(var.initial_admin_email)
    preferred_username = trimspace(var.initial_admin_username)
  }
}

resource "aws_cognito_user_in_group" "initial_admin" {
  count = trimspace(var.initial_admin_email) == "" ? 0 : 1

  user_pool_id = aws_cognito_user_pool.main.id
  group_name   = aws_cognito_user_group.roles["ADMIN"].name
  username     = aws_cognito_user.initial_admin[0].username
}

# Username-based production pool. The original pool above is intentionally
# retained during this migration so switching issuers cannot lock out the only
# administrator. Remove the legacy pool only after login to this pool is proven.
resource "aws_cognito_user_pool" "username_main" {
  name = "${local.name}-users"

  alias_attributes         = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length                   = 12
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = true
    require_uppercase                = true
    temporary_password_validity_days = 7
  }

  admin_create_user_config {
    allow_admin_create_user_only = true
    invite_message_template {
      email_subject = "Your Perkhaven account"
      email_message = "Welcome to Perkhaven. Your registration username is {username} and your temporary password is {####}. Open ${local.application_public_url} to sign in and set your permanent password. This temporary password expires in 7 days."
      sms_message   = "Perkhaven username: {username}; temporary password: {####}"
    }
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  user_attribute_update_settings {
    attributes_require_verification_before_update = ["email"]
  }

  deletion_protection = "ACTIVE"
}

resource "aws_cognito_user_pool_client" "username_frontend" {
  name         = "${local.name}-username-frontend"
  user_pool_id = aws_cognito_user_pool.username_main.id

  generate_secret                      = false
  prevent_user_existence_errors        = "ENABLED"
  enable_token_revocation              = true
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email", "profile"]
  supported_identity_providers         = ["COGNITO"]
  explicit_auth_flows                  = ["ALLOW_USER_PASSWORD_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]
  callback_urls                        = var.enable_custom_domain ? ["https://${var.domain_name}/", "https://www.${var.domain_name}/"] : ["${local.application_public_url}/"]
  logout_urls                          = var.enable_custom_domain ? ["https://${var.domain_name}/", "https://www.${var.domain_name}/"] : ["${local.application_public_url}/"]

  access_token_validity  = 60
  id_token_validity      = 60
  refresh_token_validity = 30
  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }
}

resource "aws_cognito_user_pool_domain" "username_main" {
  domain       = "${local.name}-users-${data.aws_caller_identity.current.account_id}"
  user_pool_id = aws_cognito_user_pool.username_main.id
}

resource "aws_cognito_user_group" "username_roles" {
  for_each = {
    ADMIN             = 10
    CHAIRMAN          = 20
    MANAGING_DIRECTOR = 30
    WARDEN            = 40
    STAFF             = 50
    STUDENT           = 60
  }

  name         = each.key
  precedence   = each.value
  user_pool_id = aws_cognito_user_pool.username_main.id
}

resource "aws_cognito_user" "username_initial_admin" {
  count = trimspace(var.initial_admin_email) == "" ? 0 : 1

  user_pool_id             = aws_cognito_user_pool.username_main.id
  username                 = trimspace(var.initial_admin_username)
  desired_delivery_mediums = ["EMAIL"]

  attributes = {
    email              = trimspace(var.initial_admin_email)
    preferred_username = trimspace(var.initial_admin_username)
  }
}

resource "aws_cognito_user_in_group" "username_initial_admin" {
  count = trimspace(var.initial_admin_email) == "" ? 0 : 1

  user_pool_id = aws_cognito_user_pool.username_main.id
  group_name   = aws_cognito_user_group.username_roles["ADMIN"].name
  username     = aws_cognito_user.username_initial_admin[0].username
}

resource "aws_ses_domain_identity" "main" {
  count  = var.enable_ses_domain ? 1 : 0
  domain = var.domain_name
}

resource "aws_route53_record" "ses_verification" {
  count   = var.enable_ses_domain ? 1 : 0
  zone_id = local.route53_zone_id
  name    = "_amazonses.${var.domain_name}"
  type    = "TXT"
  ttl     = 600
  allow_overwrite = true
  records = [aws_ses_domain_identity.main[0].verification_token]
}

resource "aws_ses_domain_identity_verification" "main" {
  count      = var.enable_ses_domain ? 1 : 0
  domain     = aws_ses_domain_identity.main[0].id
  depends_on = [aws_route53_record.ses_verification]
}

resource "aws_ses_domain_dkim" "main" {
  count  = var.enable_ses_domain ? 1 : 0
  domain = aws_ses_domain_identity.main[0].domain
}

resource "aws_route53_record" "ses_dkim" {
  count = var.enable_ses_domain ? 3 : 0

  zone_id = local.route53_zone_id
  name    = "${aws_ses_domain_dkim.main[0].dkim_tokens[count.index]}._domainkey.${var.domain_name}"
  type    = "CNAME"
  ttl     = 600
  allow_overwrite = true
  records = ["${aws_ses_domain_dkim.main[0].dkim_tokens[count.index]}.dkim.amazonses.com"]
}

resource "aws_ses_domain_mail_from" "main" {
  count            = var.enable_ses_domain ? 1 : 0
  domain           = aws_ses_domain_identity.main[0].domain
  mail_from_domain = "mail.${var.domain_name}"
}

resource "aws_route53_record" "ses_mail_from_mx" {
  count   = var.enable_ses_domain ? 1 : 0
  zone_id = local.route53_zone_id
  name    = aws_ses_domain_mail_from.main[0].mail_from_domain
  type    = "MX"
  ttl     = 600
  allow_overwrite = true
  records = ["10 feedback-smtp.${var.aws_region}.amazonses.com"]
}

resource "aws_route53_record" "ses_mail_from_spf" {
  count   = var.enable_ses_domain ? 1 : 0
  zone_id = local.route53_zone_id
  name    = aws_ses_domain_mail_from.main[0].mail_from_domain
  type    = "TXT"
  ttl     = 600
  allow_overwrite = true
  records = ["v=spf1 include:amazonses.com -all"]
}

resource "aws_route53_record" "dmarc" {
  count   = var.enable_ses_domain ? 1 : 0
  zone_id = local.route53_zone_id
  name    = "_dmarc.${var.domain_name}"
  type    = "TXT"
  ttl     = 600
  allow_overwrite = true
  records = ["v=DMARC1; p=none; rua=mailto:dmarc@${var.domain_name}"]
}
