#!/usr/bin/env bash
# Runs the migration and RLS tests against a throwaway local Postgres.
# Usage: PGURL=postgres://user@localhost/postgres ./supabase/tests/run_local.sh
set -euo pipefail
cd "$(dirname "$0")/.."
PGURL="${PGURL:-postgres:///postgres}"
DB="lifehub_test_$$"
psql "$PGURL" -qc "create database $DB" >/dev/null
trap 'psql "$PGURL" -qc "drop database if exists $DB" >/dev/null' EXIT
TEST_URL="${PGURL%/*}/$DB"
psql "$TEST_URL" -q -v ON_ERROR_STOP=1 -f tests/00_local_stubs.sql
# An account that exists before the migration runs (Life Hub added to an existing project).
psql "$TEST_URL" -q -v ON_ERROR_STOP=1 -c "insert into auth.users (id, email) values ('99999999-9999-9999-9999-999999999999', 'Early@Example.com')"
for f in migrations/*.sql; do psql "$TEST_URL" -q -v ON_ERROR_STOP=1 -f "$f"; done
psql "$TEST_URL" -q -v ON_ERROR_STOP=1 -f tests/rls_test.sql
echo "All RLS tests passed."
