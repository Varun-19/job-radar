#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
mkdir -p .local
case "${1:-start}" in
 start)
  if [ ! -f .local/postgres/PG_VERSION ]; then
   printf '%s' jobradar > .local/pg-password
   chmod 600 .local/pg-password
   initdb -D .local/postgres -U jobradar --auth=scram-sha-256 --pwfile=.local/pg-password
   rm .local/pg-password
  fi
  if ! pg_ctl -D .local/postgres status >/dev/null 2>&1; then
   pg_ctl -D .local/postgres -l .local/postgres.log -o '-h 127.0.0.1 -p 55432 -k /tmp' start
  fi
  jobradar_exists=$(PGPASSWORD=jobradar psql -h 127.0.0.1 -p 55432 -U jobradar -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='jobradar'")
  [ "$jobradar_exists" = 1 ] || PGPASSWORD=jobradar createdb -h 127.0.0.1 -p 55432 -U jobradar jobradar
  ;;
 stop) pg_ctl -D .local/postgres stop ;;
 *) printf '%s\n' 'Use start or stop'; exit 1 ;;
esac
