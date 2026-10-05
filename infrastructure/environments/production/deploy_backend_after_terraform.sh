#!/usr/bin/env bash
set -euo pipefail

if [[ "${PERKHAVEN_BACKEND_CHANGED:-false}" != "true" ]]; then
  echo "No backend change detected; skipping backend rollout."
  exit 0
fi

echo "Reading production outputs..."
CLUSTER=$(terraform output -raw ecs_cluster_name)
SERVICE=$(terraform output -raw ecs_service_name)
TASK_DEFINITION=$(terraform output -raw ecs_task_definition_arn)
SECURITY_GROUP=$(terraform output -raw ecs_security_group_id)
SUBNETS=$(terraform output -json ecs_subnet_ids | jq -c '.')
DATABASE_IDENTIFIER=$(terraform output -raw database_identifier)

snapshot_identifier="${DATABASE_IDENTIFIER}-pre-invoice-renumber"
if ! aws rds describe-db-snapshots --db-snapshot-identifier "$snapshot_identifier" >/dev/null 2>&1; then
  echo "Creating pre-migration RDS snapshot: $snapshot_identifier"
  aws rds create-db-snapshot     --db-instance-identifier "$DATABASE_IDENTIFIER"     --db-snapshot-identifier "$snapshot_identifier" >/dev/null
  aws rds wait db-snapshot-completed --db-snapshot-identifier "$snapshot_identifier"
else
  echo "Pre-migration snapshot already exists."
fi

network_configuration=$(jq -cn   --argjson subnets "$SUBNETS"   --arg security_group "$SECURITY_GROUP"   '{awsvpcConfiguration:{subnets:$subnets,securityGroups:[$security_group],assignPublicIp:"ENABLED"}}')

overrides='{"containerOverrides":[{"name":"backend","command":["--spring.main.web-application-type=none","--spring.main.banner-mode=off","--perkhaven.migration-only=true","--perkhaven.scheduling.enabled=false","--perkhaven.storage.provider=local"]}]}'

echo "Starting Flyway migration task..."
run_task_response=$(aws ecs run-task   --cluster "$CLUSTER"   --launch-type FARGATE   --task-definition "$TASK_DEFINITION"   --network-configuration "$network_configuration"   --overrides "$overrides")

task_arn=$(jq -r '.tasks[0].taskArn // empty' <<< "$run_task_response")
if [[ -z "$task_arn" ]]; then
  echo "ECS did not start the migration task." >&2
  jq '.failures' <<< "$run_task_response"
  exit 1
fi

if ! timeout 15m aws ecs wait tasks-stopped --cluster "$CLUSTER" --tasks "$task_arn"; then
  echo "Migration task timed out." >&2
  aws ecs stop-task --cluster "$CLUSTER" --task "$task_arn"     --reason "Migration timeout" >/dev/null 2>&1 || true
  exit 1
fi

exit_code=$(aws ecs describe-tasks   --cluster "$CLUSTER"   --tasks "$task_arn"   --query 'tasks[0].containers[?name==`backend`].exitCode | [0]'   --output text)

echo "Migration exit code: $exit_code"
if [[ "$exit_code" != "0" ]]; then
  echo "Migration task details:"
  aws ecs describe-tasks     --cluster "$CLUSTER"     --tasks "$task_arn"     --query 'tasks[0].{taskArn:taskArn,stopCode:stopCode,stoppedReason:stoppedReason,containers:containers[*].{name:name,reason:reason,exitCode:exitCode,lastStatus:lastStatus,logStreamName:logStreamName}}'     --output json || true

  log_group=$(aws ecs describe-task-definition     --task-definition "$TASK_DEFINITION"     --query 'taskDefinition.containerDefinitions[?name==`backend`].logConfiguration.options."awslogs-group" | [0]'     --output text)

  task_id="${task_arn##*/}"
  echo "Migration log group: $log_group"
  echo "Migration task id: $task_id"

  if [[ -n "$log_group" && "$log_group" != "None" ]]; then
    log_stream=$(aws logs describe-log-streams       --log-group-name "$log_group"       --log-stream-name-prefix "backend/backend/"       --order-by LastEventTime       --descending       --max-items 20       --query "logStreams[?contains(logStreamName, '${task_id}')].logStreamName | [0]"       --output text 2>/dev/null || true)

    if [[ -z "$log_stream" || "$log_stream" == "None" ]]; then
      log_stream=$(aws logs describe-log-streams         --log-group-name "$log_group"         --order-by LastEventTime         --descending         --max-items 20         --query "logStreams[?contains(logStreamName, '${task_id}')].logStreamName | [0]"         --output text 2>/dev/null || true)
    fi

    echo "Migration log stream: $log_stream"
    if [[ -n "$log_stream" && "$log_stream" != "None" ]]; then
      echo "----- Flyway task logs -----"
      aws logs get-log-events         --log-group-name "$log_group"         --log-stream-name "$log_stream"         --limit 200         --query 'events[*].message'         --output text || true
      echo "----- End Flyway task logs -----"
    fi
  fi
  exit 1
fi

echo "Deploying backend service..."
aws ecs update-service   --cluster "$CLUSTER"   --service "$SERVICE"   --task-definition "$TASK_DEFINITION"   --desired-count 1   --force-new-deployment >/dev/null

aws ecs wait services-stable --cluster "$CLUSTER" --services "$SERVICE"
echo "Backend migration and deployment completed."
