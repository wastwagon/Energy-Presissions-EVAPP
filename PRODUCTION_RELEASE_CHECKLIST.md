# Production Release Checklist (VPS + Coolify)

Use this checklist before every production release.

## 1) Pre-Release Gates

- [ ] All required secrets set in Coolify:
  - `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
  - `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`
  - `JWT_SECRET` (>=32 chars)
  - `SERVICE_TOKEN` (>=32 chars)
  - `FRONTEND_URL`, `CORS_ORIGINS`
- [ ] `CORS_ORIGINS` has no wildcard (`*`)
- [ ] `ENABLE_SWAGGER=false`
- [ ] `INCLUDE_SAMPLE_DATA=false` (enforced)
- [ ] Backup performed today:
  - `./scripts/backup-postgres.sh`
  - `./scripts/backup-minio.sh`

## 2) Preflight Validation

- [ ] Run:
  - `./scripts/preflight-coolify.sh docker-compose.coolify.yml .env.coolify`
- [ ] `docker compose config` passes with current env
- [ ] No unresolved healthcheck or startup dependency changes

## 3) Deployment

- [ ] Deploy from approved commit/tag in Coolify
- [ ] Wait for healthy state:
  - `postgres`, `redis`, `minio`, `csms-api`, `frontend`, `nginx`
- [ ] Confirm ingress route points to `nginx`

## 4) Smoke Tests (Blocking)

- [ ] App root loads:
  - `https://app.yourdomain.com/`
- [ ] API health through ingress:
  - `https://app.yourdomain.com/api/health`
- [ ] Login succeeds with production admin account
- [ ] Dashboard/stats APIs return successful responses
- [ ] WebSocket connects on:
  - `wss://app.yourdomain.com/ws`
- [ ] OCPP endpoint reachable for chargers:
  - `wss://app.yourdomain.com/ocpp`
- [ ] No CORS errors in browser DevTools

## 5) Post-Release Monitoring (First 15-30 min)

- [ ] No sustained 5xx spikes in API logs
- [ ] No repeated restart/crash loops
- [ ] DB/Redis/MinIO remain healthy
- [ ] Charger connections stable
- [ ] Request latency within normal range

## 6) Rollback Readiness

- [ ] Previous known-good commit/tag identified
- [ ] Rollback procedure reviewed (`OPERATIONS_RUNBOOK.md`)
- [ ] Database rollback/restore plan prepared if schema changed

## 7) Release Record

- [ ] Record release metadata:
  - commit/tag:
  - deployment time:
  - operator:
  - outcome:
  - follow-ups:
