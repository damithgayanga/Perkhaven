locals {
  mymailportal_cname_hosts = toset([
    "autoconfig",
    "autodiscover",
    "mail",
    "webmail",
  ])
}

resource "aws_route53_record" "mymailportal_mx" {
  count   = var.enable_mymailportal_mail ? 1 : 0
  zone_id = local.route53_zone_id
  name    = var.domain_name
  type    = "MX"
  ttl     = 3600
  records = ["0 mail.mymailportal.lk"]
}

resource "aws_route53_record" "mymailportal_spf" {
  count   = var.enable_mymailportal_mail ? 1 : 0
  zone_id = local.route53_zone_id
  name    = var.domain_name
  type    = "TXT"
  ttl     = 3600
  records = ["v=spf1 mx ~all"]
}

resource "aws_route53_record" "mymailportal_cname" {
  for_each = var.enable_mymailportal_mail ? local.mymailportal_cname_hosts : toset([])

  zone_id = local.route53_zone_id
  name    = "${each.value}.${var.domain_name}"
  type    = "CNAME"
  ttl     = 3600
  records = ["mail.mymailportal.lk"]
}

resource "aws_route53_record" "mymailportal_dkim" {
  count   = var.enable_mymailportal_mail ? 1 : 0
  zone_id = local.route53_zone_id
  name    = "s20260914981._domainkey.${var.domain_name}"
  type    = "TXT"
  ttl     = 3600
  records = ["k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCif9Fyl4SjV4C4Y8WePOKnrStJ6nFwhCkMv+YDV00rou7iXxDRAuQHkfouzF+2HjudT7Pqr3JEWVHJNj1OIYPLgH8hmXrVjXTvfQIs65LbTTVEfd0cOftRSeTFxmkGwDvU3iI2O3Sr2JDjL+SWiwHn3JaBWY2bPEgcB1HvU4LoywIDAQAB"]
}

moved {
  from = aws_route53_record.mymailportal_dmarc[0]
  to   = aws_route53_record.dmarc[0]
}
