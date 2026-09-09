#!/usr/bin/env bash
# Sobe um PostgreSQL temporário, aplica as migrações e roda os testes de banco.
# Não toca em nenhum banco existente.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$HERE/../.."
PORT="${PGPORT_TEST:-5455}"

for candidate in /usr/lib/postgresql/*/bin /usr/local/pgsql/bin /opt/homebrew/opt/postgresql@16/bin; do
  [ -d "$candidate" ] && PATH="$candidate:$PATH"
done
export PATH

command -v initdb >/dev/null || {
  echo "PostgreSQL não encontrado no PATH. Instale o pacote do servidor (não só o psql)."
  exit 1
}

# initdb se recusa a rodar como root. Em contêineres onde só existe o root,
# o trabalho é delegado ao usuário postgres.
if [ "$(id -u)" = "0" ] && [ -z "${CONTROLDOLCES_TEST_DIR:-}" ]; then
  if id postgres >/dev/null 2>&1; then
    WORK="$(mktemp -d /var/lib/postgresql/controldolces.XXXXXX)"
    chown postgres:postgres "$WORK"
    chmod 700 "$WORK"
    exec su postgres -s /bin/bash -c \
      "CONTROLDOLCES_TEST_DIR='$WORK' PATH='$PATH' bash '$HERE/run.sh'"
  fi
  echo "Rode este script como um usuário comum: o PostgreSQL não inicia como root."
  exit 1
fi

WORK="${CONTROLDOLCES_TEST_DIR:-$(mktemp -d)}"
DATA="$WORK/pgdata"
SOCKET="$WORK/socket"
mkdir -p "$SOCKET"

cleanup() {
  pg_ctl -D "$DATA" stop -m immediate >/dev/null 2>&1 || true
  rm -rf "$WORK"
}
trap cleanup EXIT

initdb -D "$DATA" -A trust >/dev/null
pg_ctl -D "$DATA" -l "$DATA/log.txt" -o "-p $PORT -k $SOCKET" start >/dev/null

run() { psql -h "$SOCKET" -p "$PORT" -d postgres -v ON_ERROR_STOP=1 "$@"; }

echo "Preparando ambiente..."
run -q -f "$HERE/00_supabase_stub.sql"

for migration in "$ROOT"/supabase/migrations/*.sql; do
  echo "Aplicando $(basename "$migration")"
  run -q -f "$migration"
done

echo
echo "Executando testes..."
run -f "$HERE/10_isolamento.sql"
