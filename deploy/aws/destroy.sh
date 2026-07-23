#!/usr/bin/env bash
#
# Borra todo lo que creó provision.sh: instancia, Elastic IP y security
# group.
#
#   bash deploy/aws/destroy.sh
#
# Importa hacerlo al acabar la demo: una Elastic IP SIN ASOCIAR se cobra
# por hora, así que dejarla suelta va comiendo el crédito del Learner Lab
# aunque la instancia esté apagada.
#
# DESTRUCTIVO: se pierde la base de datos de la instancia. Pide
# confirmación antes de tocar nada.
set -euo pipefail

export MSYS_NO_PATHCONV=1

REGION="${AWS_REGION:-us-east-1}"
NOMBRE="${NOMBRE:-anavet-demo}"
SG_NOMBRE="$NOMBRE-sg"

paso() { echo -e "\n\033[1;36m▶ $*\033[0m"; }
info() { echo "  $*"; }

aws_() { aws --region "$REGION" --output text "$@"; }

command -v aws >/dev/null 2>&1 || { echo "El AWS CLI no está instalado." >&2; exit 1; }

# ── Inventario de lo que se va a borrar ──────────────────────
ID=$(aws_ ec2 describe-instances \
  --filters Name=tag:Name,Values="$NOMBRE" 'Name=instance-state-name,Values=pending,running,stopped,stopping' \
  --query 'Reservations[0].Instances[0].InstanceId' 2>/dev/null || echo "None")
ALLOC=$(aws_ ec2 describe-addresses --filters Name=tag:Name,Values="$NOMBRE" \
  --query 'Addresses[0].AllocationId' 2>/dev/null || echo "None")
EIP=$(aws_ ec2 describe-addresses --filters Name=tag:Name,Values="$NOMBRE" \
  --query 'Addresses[0].PublicIp' 2>/dev/null || echo "None")

echo
echo "Se va a ELIMINAR de la región $REGION:"
[[ "$ID"    != "None" && -n "$ID"    ]] && echo "  · Instancia    $ID (con su base de datos)" || echo "  · Instancia    (ninguna)"
[[ "$EIP"   != "None" && -n "$EIP"   ]] && echo "  · Elastic IP   $EIP"                        || echo "  · Elastic IP   (ninguna)"
echo "  · Security group $SG_NOMBRE"
echo

if [[ "$ID" == "None" && "$ALLOC" == "None" ]]; then
  echo "No hay nada que borrar."
  exit 0
fi

read -r -p "Escribe BORRAR para confirmar: " RESPUESTA
[[ "$RESPUESTA" == "BORRAR" ]] || { echo "Cancelado. No se tocó nada."; exit 0; }

# ── Instancia ────────────────────────────────────────────────
if [[ "$ID" != "None" && -n "$ID" ]]; then
  paso "Terminando la instancia"
  aws_ ec2 terminate-instances --instance-ids "$ID" >/dev/null
  info "Esperando a que termine…"
  aws --region "$REGION" ec2 wait instance-terminated --instance-ids "$ID"
  info "$ID terminada"
fi

# ── Elastic IP ───────────────────────────────────────────────
if [[ "$ALLOC" != "None" && -n "$ALLOC" ]]; then
  paso "Liberando la Elastic IP"
  aws_ ec2 release-address --allocation-id "$ALLOC" >/dev/null
  info "$EIP liberada"
fi

# ── Security group ───────────────────────────────────────────
# Va al final: no se puede borrar mientras una instancia lo use, y por eso
# arriba se espera a instance-terminated.
paso "Borrando el security group"
SG=$(aws_ ec2 describe-security-groups --filters Name=group-name,Values="$SG_NOMBRE" \
  --query 'SecurityGroups[0].GroupId' 2>/dev/null || echo "None")
if [[ "$SG" != "None" && -n "$SG" ]]; then
  aws_ ec2 delete-security-group --group-id "$SG" >/dev/null 2>&1 \
    && info "$SG borrado" \
    || info "$SG no se pudo borrar (¿en uso?); bórralo a mano si hace falta"
else
  info "(no existía)"
fi

echo -e "\n\033[1;32m✓ Limpieza terminada. No queda nada consumiendo crédito.\033[0m"
