resource "aws_route53_zone" "main" {
  count = var.enable_custom_domain && var.create_route53_zone ? 1 : 0
  name  = var.domain_name
}

locals {
  route53_zone_id = var.enable_custom_domain ? (var.create_route53_zone ? aws_route53_zone.main[0].zone_id : var.route53_zone_id) : null
}

resource "aws_acm_certificate" "cloudfront" {
  count    = var.enable_custom_domain ? 1 : 0
  provider = aws.us_east_1

  domain_name               = var.domain_name
  subject_alternative_names = ["www.${var.domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "cloudfront_certificate" {
  for_each = var.enable_custom_domain ? {
    for option in aws_acm_certificate.cloudfront[0].domain_validation_options : option.domain_name => {
      name   = option.resource_record_name
      record = option.resource_record_value
      type   = option.resource_record_type
    }
  } : {}

  zone_id = local.route53_zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 60
  allow_overwrite = true
  records = [each.value.record]
}

resource "aws_acm_certificate_validation" "cloudfront" {
  count    = var.enable_custom_domain ? 1 : 0
  provider = aws.us_east_1

  certificate_arn         = aws_acm_certificate.cloudfront[0].arn
  validation_record_fqdns = [for record in aws_route53_record.cloudfront_certificate : record.fqdn]
}
