#!/usr/bin/env bash
#
# Respaldo de la base de datos de ANA-vet.
#
# Lo dispara a diario el timer de systemd (anavet-backup.timer), pero
# también se puede correr a mano:  sudo bash deploy/aws/backup.sh
#
# Corre como root: MariaDB autentica al root del sistema por unix_socket,
# así que mysqldump no necesita contraseña.
set -euo pipefail

DB="${DB_NAME:-clinica_veterinaria}"
DIR="${BACKUP_DIR:-/var/backups/anavet}"
RETENER_DIAS="${RETENER_DIAS:-14}"

mkdir -p "$DIR"
STAMP=$(date +%F_%H%M%S)
OUT="$DIR/anavet_${STAMP}.sql.gz"

# --single-transaction: respaldo consistente sin bloquear la operación de
# la clínica. --routines/--events: incluye procedimientos y eventos.
mysqldump --single-transaction --quick --routines --events "$DB" | gzip -9 > "$OUT"

# Rotación: descarta lo más viejo que la ventana de retención.
find "$DIR" -name 'anavet_*.sql.gz' -mtime +"$RETENER_DIAS" -delete

# Copia fuera de la máquina (recomendado en producción): si el disco de
# la instancia muere, los respaldos locales mueren con él. Requiere el
# AWS CLI configurado y un bucket.  export BACKUP_S3=mi-bucket/anavet
if [ -n "${BACKUP_S3:-}" ]; then
  aws s3 cp "$OUT" "s3://${BACKUP_S3}/" --only-show-errors && echo "  → subido a s3://${BACKUP_S3}/"
fi

TAM=$(du -h "$OUT" | cut -f1)
N=$(find "$DIR" -name 'anavet_*.sql.gz' | wc -l | tr -d ' ')
echo "Respaldo OK: $OUT ($TAM) · retención ${RETENER_DIAS}d · ${N} respaldos en disco"
