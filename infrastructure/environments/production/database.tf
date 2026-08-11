resource "aws_db_subnet_group" "main" {
  name       = local.name
  subnet_ids = [for subnet in aws_subnet.database : subnet.id]
  tags       = { Name = local.name }
}

resource "aws_db_instance" "postgres" {
  identifier = local.name

  engine                      = "postgres"
  instance_class              = var.database_instance_class
  allocated_storage           = var.database_allocated_storage
  max_allocated_storage       = var.database_max_allocated_storage
  storage_type                = "gp3"
  storage_encrypted           = true
  db_name                     = "perkhaven"
  username                    = "perkhaven"
  manage_master_user_password = true
  port                        = 5432

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.database.id]
  publicly_accessible    = false
  multi_az               = false

  backup_retention_period = 7
  backup_window           = "18:00-19:00"
  maintenance_window      = "sun:19:30-sun:20:30"
  copy_tags_to_snapshot   = true

  auto_minor_version_upgrade = true
  deletion_protection        = var.database_deletion_protection
  skip_final_snapshot        = var.database_skip_final_snapshot
  final_snapshot_identifier  = var.database_skip_final_snapshot ? null : "${local.name}-final"

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  lifecycle {
    prevent_destroy = true
  }
}
