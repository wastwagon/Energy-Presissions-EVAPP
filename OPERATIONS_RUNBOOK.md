# Operations Runbook (VPS + Coolify)

This runbook is for production operations of the stack deployed via `docker-compose.coolify.yml`.

## Service Map

- `nginx`: public ingress
- `frontend`: static app + same-origin `/api` and `/ws` routing
- `csms-api`: main API + Socket.IO + OCPP integration
- `postgres`: primary relational database
- `redis`: pub/sub + runtime cache
- `minio`: object storage

## Daily Health Checks

- App:
  - `curl -fsS https://app.yourdomain.com/ >/dev/null`
- API through ingress:
  - `curl -fsS https://app.yourdomain.com/api/health`
- OCPP endpoint reachable:
  - verify charger connections to `wss://app.yourdomain.com/ocpp`
- Coolify service health:
  - ensure all services are `healthy`

## Incident Triage (Fast Path)

1. Confirm ingress:
   - check `nginx` health/logs first.
2. Confirm API health:
   - `csms-api` service up and `/health` returns 200.
3. Confirm DB/Redis/MinIO:
   - any dependency unhealthy can cascade to API failures.
4. Check browser/network symptoms:
   - if UI loads but API fails, inspect `/api/*` responses.
5. Check recent deploy:
   - rollback to last known good if issue started post-deploy.

## Restart Order (When Needed)

Use this order to minimize cascading failures:

1. `postgres`
2. `redis`
3. `minio`
4. `csms-api`
5. `frontend`
6. `nginx`

Only restart downstream services after upstream health is green.

## Backup Procedures

### PostgreSQL Backup

- Run:
  - `POSTGRES_USER=... POSTGRES_PASSWORD=... POSTGRES_DB=... ./scripts/backup-postgres.sh`
- Output:
  - `./backups/postgres/<db>-YYYYmmdd-HHMMSS.sql.gz`

### MinIO Backup

- Run:
  - `./scripts/backup-minio.sh`
- Output:
  - `./backups/minio/minio-YYYYmmdd-HHMMSS.tar.gz`

### Retention

- Both scripts prune old files by `RETENTION_DAYS` (default `14`).
- Override per run:
  - `RETENTION_DAYS=30 ./scripts/backup-postgres.sh`

## Restore Drill (Quarterly Minimum)

### PostgreSQL Restore

1. Ensure a maintenance window (writes paused).
2. Restore:
   - `POSTGRES_USER=... POSTGRES_PASSWORD=... POSTGRES_DB=... ./scripts/restore-postgres.sh ./backups/postgres/<file>.sql.gz`
3. Validate:
   - `/api/health`
   - login and key dashboard endpoints

### MinIO Restore (Volume-level)

1. Stop services that write files.
2. Restore archive into MinIO data path (maintenance mode).
3. Start services and verify media/object access paths.

## Deployment / Upgrade Procedure

1. Run preflight:
   - `./scripts/preflight-coolify.sh docker-compose.coolify.yml .env.coolify`
2. Deploy in Coolify.
3. Verify all services healthy.
4. Smoke test:
   - app root
   - login
   - dashboard stats
   - websocket `/ws`
   - charger OCPP `/ocpp`
5. Monitor logs for 10-15 minutes.

## Rollback Procedure

1. Re-deploy previous known-good commit/tag in Coolify.
2. Confirm health of all services.
3. Re-run smoke tests.
4. If data migration introduced incompatibility, execute planned DB rollback/restore.

## Security Operations

- Rotate periodically:
  - `JWT_SECRET`
  - `SERVICE_TOKEN`
  - DB and MinIO credentials
- Keep strict CORS:
  - explicit `CORS_ORIGINS`, no wildcards
- Keep `ENABLE_SWAGGER=false` in production unless temporarily needed.
- Never enable `INCLUDE_SAMPLE_DATA` in production.

## Log Management

- Docker log rotation is configured in compose (`json-file`, max-size/max-file).
- For long-term audit:
  - ship logs to external storage/observability stack (recommended).

## Capacity Notes

- Watch VPS disk usage closely (DB + MinIO + logs + backups).
- Keep backups off-host as well (object storage or secondary server).
- Scale vertically first for single-node deployment:
  - CPU/RAM for `csms-api`
  - storage IOPS/capacity for `postgres` and `minio`

## Change Management Checklist

Before production changes:

- preflight passes
- backup taken
- rollback target identified
- maintenance window communicated (if needed)

After production changes:

- smoke tests pass
- no elevated 4xx/5xx in logs
- charger connections stable
