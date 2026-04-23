# Coolify Deployment Guide (VPS + Docker Compose)

This project can run fully on your VPS with Coolify using `docker-compose.coolify.yml`.

## 1) Coolify Project Setup

- Create a new **Docker Compose** service in Coolify.
- Point it to this repository and branch.
- Set Compose file path to:
  - `docker-compose.coolify.yml`
- Expose only the `nginx` service through Coolify ingress.

## 2) Required Environment Variables

Set these in Coolify before first deploy:

- `POSTGRES_USER` (strong value)
- `POSTGRES_PASSWORD` (strong value)
- `POSTGRES_DB` (optional; defaults to `ev_billing_db`)
- `MINIO_ROOT_USER` (strong value)
- `MINIO_ROOT_PASSWORD` (strong value)
- `JWT_SECRET` (long random secret)
- `SERVICE_TOKEN` (long random secret used by internal API/OCPP calls)
- `FRONTEND_URL` (your app URL, e.g. `https://app.yourdomain.com`)
- `CORS_ORIGINS` (comma-separated allowed web origins; include `FRONTEND_URL`)

Recommended:

- `CORS_STRICT_ORIGINS=true`
- `MIGRATIONS_AUTO_RUN=true`
- `INCLUDE_SAMPLE_DATA=false`
- `ENABLE_SWAGGER=false`

Optional payment envs:

- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_PUBLIC_KEY`
- `PAYSTACK_CALLBACK_URL`

## 3) Domain / TLS Routing

Recommended external domains:

- App UI: `https://app.yourdomain.com` -> Coolify ingress -> `nginx` service
- API (same host through proxy): `https://app.yourdomain.com/api/*`
- Socket.IO: `wss://app.yourdomain.com/ws`
- OCPP chargers: `wss://app.yourdomain.com/ocpp` (proxied by nginx)

Because frontend is built with `VITE_API_URL=/api`, browser calls are same-origin and avoid CORS issues.

## 4) First Deploy Checklist

1. Deploy stack in Coolify.
2. Wait until all services are healthy:
   - `postgres`
   - `redis`
   - `minio`
   - `csms-api`
   - `frontend`
   - `nginx`
3. Open app domain and verify login page loads.
4. Test API health from app domain:
   - `https://app.yourdomain.com/api/health`
5. Confirm browser network requests are same-origin (`/api/...`), not a second API origin.
6. Run preflight locally before deploy:
   - `./scripts/preflight-coolify.sh docker-compose.coolify.yml .env.coolify`

## 5) Post-Deploy Verification

From your local machine:

- App root:
  - `curl -i https://app.yourdomain.com/`
- API health through proxy:
  - `curl -i https://app.yourdomain.com/api/health`
- WebSocket upgrade check (manual via browser devtools):
  - connection target should be `wss://app.yourdomain.com/ws`
- OCPP endpoint availability:
  - chargers should connect to `wss://app.yourdomain.com/ocpp`

In browser DevTools:

- No CORS preflight errors
- No `ERR_NETWORK` for `/api/*`
- Dashboard requests return `200`

## 6) Security Notes

- Do not use default/demo credentials in production.
- Rotate `JWT_SECRET` and `SERVICE_TOKEN` periodically.
- Keep `CORS_ORIGINS` explicit and minimal.
- Keep DB/Redis/MinIO internal only (already enforced in Coolify compose).

## 7) Backup Recommendations

- Postgres: daily dump + offsite retention.
  - `./scripts/backup-postgres.sh`
  - restore test: `./scripts/restore-postgres.sh ./backups/postgres/<file>.sql.gz`
- MinIO: bucket backup/sync schedule.
  - `./scripts/backup-minio.sh`
- Store Coolify env secrets in a secure vault.
- Test restore process at least once before go-live.

Suggested cron (on VPS host):

- Postgres backup daily at 02:00:
  - `0 2 * * * cd /path/to/repo && POSTGRES_USER=... POSTGRES_PASSWORD=... POSTGRES_DB=... ./scripts/backup-postgres.sh`
- MinIO backup daily at 02:30:
  - `30 2 * * * cd /path/to/repo && ./scripts/backup-minio.sh`

## 8) Common Issues

- **502 from ingress**: check `nginx` health and upstream service health.
- **Login/API network errors**: verify `FRONTEND_URL` + `CORS_ORIGINS` values.
- **Migrations fail**: inspect `csms-api` logs; re-run with corrected DB env.
- **OCPP offline**: verify chargers use `/ocpp` path and TLS-valid domain.
