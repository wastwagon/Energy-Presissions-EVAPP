#!/usr/bin/env sh
set -eu

COMPOSE_FILE="${1:-docker-compose.coolify.yml}"
ENV_FILE="${2:-.env.coolify}"

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "ERROR: Compose file not found: $COMPOSE_FILE"
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: Env file not found: $ENV_FILE"
  echo "Hint: copy .env.coolify.example to .env.coolify and fill values."
  exit 1
fi

# shellcheck disable=SC1090
set -a
. "$ENV_FILE"
set +a

required_vars="
POSTGRES_USER
POSTGRES_PASSWORD
MINIO_ROOT_USER
MINIO_ROOT_PASSWORD
JWT_SECRET
SERVICE_TOKEN
FRONTEND_URL
CORS_ORIGINS
"

missing=0
for key in $required_vars; do
  eval "val=\${$key:-}"
  if [ -z "${val}" ]; then
    echo "ERROR: missing required env var: $key"
    missing=1
  fi
done

if [ "$missing" -ne 0 ]; then
  exit 1
fi

fail=0
enforce_min_len() {
  key="$1"
  min_len="$2"
  eval "val=\${$key:-}"
  len=$(printf "%s" "$val" | wc -c | tr -d ' ')
  if [ "$len" -lt "$min_len" ]; then
    echo "ERROR: $key must be at least $min_len characters"
    fail=1
  fi
}

enforce_min_len POSTGRES_PASSWORD 12
enforce_min_len MINIO_ROOT_PASSWORD 12
enforce_min_len JWT_SECRET 32
enforce_min_len SERVICE_TOKEN 32

case "${FRONTEND_URL}" in
  https://*)
    ;;
  *)
    echo "ERROR: FRONTEND_URL must use https in production: ${FRONTEND_URL}"
    fail=1
    ;;
esac

case "${CORS_ORIGINS}" in
  *"*"*)
    echo "ERROR: CORS_ORIGINS contains wildcard. Use explicit origins."
    fail=1
    ;;
esac

if [ "$INCLUDE_SAMPLE_DATA" = "true" ]; then
  echo "ERROR: INCLUDE_SAMPLE_DATA must be false for production"
  fail=1
fi

if [ "$fail" -ne 0 ]; then
  exit 1
fi

echo "Running docker compose config validation..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" config >/dev/null

echo "Preflight checks passed for:"
echo "  compose: $COMPOSE_FILE"
echo "  env:     $ENV_FILE"
