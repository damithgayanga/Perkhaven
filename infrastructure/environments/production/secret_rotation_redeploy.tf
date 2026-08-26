data "archive_file" "database_secret_rotation_redeploy" {
  count = var.enable_database_secret_rotation_redeploy ? 1 : 0

  type        = "zip"
  output_path = "${path.module}/.terraform/database-secret-rotation-redeploy.zip"
  source {
    filename = "handler.py"
    content  = <<-PYTHON
      import os
      import boto3

      ecs = boto3.client("ecs")

      def handler(event, context):
          response = ecs.update_service(
              cluster=os.environ["ECS_CLUSTER"],
              service=os.environ["ECS_SERVICE"],
              forceNewDeployment=True,
          )
          deployment = response["service"]["deployments"][0]
          return {"deploymentId": deployment.get("id")}
    PYTHON
  }
}

resource "aws_iam_role" "database_secret_rotation_redeploy" {
  count = var.enable_database_secret_rotation_redeploy ? 1 : 0

  name = "${local.name}-secret-rotation-redeploy"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "database_secret_rotation_redeploy_logs" {
  count = var.enable_database_secret_rotation_redeploy ? 1 : 0

  role       = aws_iam_role.database_secret_rotation_redeploy[0].name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "database_secret_rotation_redeploy_ecs" {
  count = var.enable_database_secret_rotation_redeploy ? 1 : 0

  name = "restart-ecs-service"
  role = aws_iam_role.database_secret_rotation_redeploy[0].id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "ecs:UpdateService"
      Resource = aws_ecs_service.backend.id
    }]
  })
}

resource "aws_lambda_function" "database_secret_rotation_redeploy" {
  count = var.enable_database_secret_rotation_redeploy ? 1 : 0

  function_name    = "${local.name}-secret-rotation-redeploy"
  role             = aws_iam_role.database_secret_rotation_redeploy[0].arn
  handler          = "handler.handler"
  runtime          = "python3.12"
  filename         = data.archive_file.database_secret_rotation_redeploy[0].output_path
  source_code_hash = data.archive_file.database_secret_rotation_redeploy[0].output_base64sha256
  timeout          = 30

  environment {
    variables = {
      ECS_CLUSTER = aws_ecs_cluster.main.name
      ECS_SERVICE = aws_ecs_service.backend.name
    }
  }
}

resource "aws_cloudwatch_event_rule" "database_secret_rotation" {
  count = var.enable_database_secret_rotation_redeploy ? 1 : 0

  name        = "${local.name}-database-secret-rotation"
  description = "Restart ECS after RDS promotes a rotated master password."
  event_pattern = jsonencode({
    source      = ["aws.secretsmanager"]
    "detail-type" = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["secretsmanager.amazonaws.com"]
      eventName   = ["UpdateSecretVersionStage"]
      userIdentity = {
        invokedBy = ["rds.amazonaws.com"]
      }
      requestParameters = {
        secretId     = [aws_db_instance.postgres.master_user_secret[0].secret_arn]
        versionStage = ["AWSCURRENT"]
      }
    }
  })
}

resource "aws_cloudwatch_event_target" "database_secret_rotation" {
  count = var.enable_database_secret_rotation_redeploy ? 1 : 0

  rule      = aws_cloudwatch_event_rule.database_secret_rotation[0].name
  target_id = "restart-backend"
  arn       = aws_lambda_function.database_secret_rotation_redeploy[0].arn
}

resource "aws_lambda_permission" "database_secret_rotation" {
  count = var.enable_database_secret_rotation_redeploy ? 1 : 0

  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.database_secret_rotation_redeploy[0].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.database_secret_rotation[0].arn
}
