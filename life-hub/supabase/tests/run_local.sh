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
for f in migrations/*.sql; do psql "$TEST_URL" -q -v ON_ERROR_STOP=1 -f "$f"; done
psql "$TEST_URL" -q -v ON_ERROR_STOP=1 -f tests/rls_test.sql
echo "All RLS tests passed."
