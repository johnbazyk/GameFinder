#!/usr/bin/env bash
set -euo pipefail
# Only a newly created, labeled, loopback-bound container is used. Never
# consume DATABASE_URL or a preexisting container from the environment.
command -v docker >/dev/null || { echo "Docker is required for the PostgreSQL 16 suite." >&2; exit 1; }
docker info >/dev/null
password="$(node -e 'process.stdout.write(require("node:crypto").randomBytes(24).toString("hex"))')"
container="$(docker run --detach --rm --label com.gamefinder.test=05d4 -e POSTGRES_DB=gamefinder_staging_05d4 -e POSTGRES_USER=gf_staging_test -e POSTGRES_PASSWORD="$password" -p 127.0.0.1::5432 postgres:16)"
cleanup() { docker rm -f "$container" >/dev/null 2>&1 || true; }
trap cleanup EXIT
for i in $(seq 1 60); do
  if docker exec "$container" pg_isready -h 127.0.0.1 -U gf_staging_test -d gamefinder_staging_05d4 >/dev/null 2>&1; then break; fi
  sleep 1
done
docker exec "$container" pg_isready -h 127.0.0.1 -U gf_staging_test -d gamefinder_staging_05d4 >/dev/null
port="$(docker inspect --format '{{ (index (index .NetworkSettings.Ports "5432/tcp") 0).HostPort }}' "$container")"
export STAGING_TEST_DATABASE_URL="postgresql://gf_staging_test:${password}@127.0.0.1:${port}/gamefinder_staging_05d4"
export STAGING_TEST_DOCKER_CONTAINER="$container"
# Force all 11 cases to execute; the normal test command remains usable offline.
node --test scripts/catalog-staging-postgres.test.mjs
