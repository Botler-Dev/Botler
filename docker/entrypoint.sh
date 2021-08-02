#!/bin/sh

if [ "$NODE_ENV" != "production" ]; then
  DATABASE_PASSWORD=${DATABASE_PASSWORD:-botler}
fi
export DATABASE_URL=${DATABASE_URL:-"postgresql://${DATABASE_USERNAME:-postgres}:${DATABASE_PASSWORD}@${DATABASE_HOST:-localhost}:${DATABASE_PORT:-5432}/${DATABASE_DATABASE:-postgres}?${DATABASE_ARGS}"}

exec "$@"
