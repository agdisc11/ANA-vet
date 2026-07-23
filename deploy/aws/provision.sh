#!/usr/bin/env bash
#
# Crea en AWS toda la infraestructura de la demo de ANA-vet:
# security group, instancia EC2, Elastic IP y provisión automática.
#
#   bash deploy/aws/provision.sh
#
# Requiere el AWS CLI ya configurado con las credenciales del Learner Lab
# (AWS Details → AWS CLI → pegar en ~/.aws/credentials).
#
# Es idempotente: si el security group o la instancia ya existen, los
# reutiliza en vez de duplicarlos. Al terminar imprime la URL pública.
set -euo pipefail

# Git Bash sobre Windows convierte cualquier argumento que parezca ruta
# POSIX ("/aws/service/...") en una ruta de Windows y rompe las llamadas
# al CLI. Esto lo desactiva para todo el script.
export MSYS_NO_PATHCONV=1

REGION="${AWS_REGION:-us-east-1}"
NOMBRE="${NOMBRE:-anavet-demo}"
TIPO="${TIPO:-t3.small}"
DISCO_GB="${DISCO_GB:-16}"
CLAVE="${CLAVE:-vockey}"
SG_NOMBRE="$NOMBRE-sg"
AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

paso()  { echo -e "\n\033[1;36m▶ $*\033[0m"; }
info()  { echo "  $*"; }
fatal() { echo -e "\033[1;31m✗ $*\033[0m" >&2; exit 1; }

aws_() { aws --region "$REGION" --output text "$@"; }

# ─────────────────────────────────────────────────────────────
paso "0/6 · Comprobaciones"
command -v aws >/dev/null 2>&1 || fatal "El AWS CLI no está instalado."

IDENTIDAD=$(aws_ sts get-caller-identity --query 'Arn' 2>/dev/null) \
  || fatal "Credenciales no válidas o caducadas. En el Learner Lab: AWS Details → AWS CLI, y vuelve a pegarlas en ~/.aws/credentials."
info "Autenticado como: $IDENTIDAD"
info "Región: $REGION"

[[ -f "$AQUI/user-data.sh" ]] || fatal "Falta $AQUI/user-data.sh"

# El Learner Lab trae el par de claves 'vockey' ya creado.
aws_ ec2 describe-key-pairs --key-names "$CLAVE" >/dev/null 2>&1 \
  || fatal "No existe el par de claves '$CLAVE' en $REGION."

# ─────────────────────────────────────────────────────────────
paso "1/6 · Security group"
VPC=$(aws_ ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId')
[[ "$VPC" != "None" && -n "$VPC" ]] || fatal "No se encontró la VPC por defecto."
info "VPC: $VPC"

SG=$(aws_ ec2 describe-security-groups \
  --filters Name=group-name,Values="$SG_NOMBRE" Name=vpc-id,Values="$VPC" \
  --query 'SecurityGroups[0].GroupId' 2>/dev/null || echo "None")

if [[ "$SG" == "None" || -z "$SG" ]]; then
  SG=$(aws_ ec2 create-security-group \
    --group-name "$SG_NOMBRE" \
    --description "ANA-vet demo: HTTP publico, SSH restringido" \
    --vpc-id "$VPC" --query 'GroupId')
  info "Creado: $SG"
else
  info "Reutilizando: $SG"
fi

MI_IP=$(curl -fsS https://checkip.amazonaws.com 2>/dev/null | tr -d '[:space:]')
[[ -n "$MI_IP" ]] || fatal "No se pudo averiguar tu IP pública."

# El 80 abierto al mundo es el objetivo (que entre el cliente). El 22 se
# restringe a TU IP: la clave privada del Learner Lab es compartida y
# conocida, así que dejar SSH abierto a 0.0.0.0/0 sería regalar la máquina.
aws_ ec2 authorize-security-group-ingress --group-id "$SG" \
  --protocol tcp --port 80 --cidr 0.0.0.0/0 >/dev/null 2>&1 \
  && info "Puerto 80 abierto a Internet" || info "Puerto 80 ya estaba abierto"

aws_ ec2 authorize-security-group-ingress --group-id "$SG" \
  --protocol tcp --port 22 --cidr "$MI_IP/32" >/dev/null 2>&1 \
  && info "Puerto 22 abierto solo a $MI_IP" || info "Puerto 22 ya permitía $MI_IP"

# ─────────────────────────────────────────────────────────────
paso "2/6 · AMI de Amazon Linux 2023"
AMI=$(aws_ ssm get-parameters \
  --names /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64 \
  --query 'Parameters[0].Value' 2>/dev/null || echo "")

if [[ -z "$AMI" || "$AMI" == "None" ]]; then
  # Si el lab no permite leer parámetros de SSM, se busca por nombre.
  info "SSM no disponible; buscando la AMI por nombre…"
  AMI=$(aws_ ec2 describe-images --owners amazon \
    --filters 'Name=name,Values=al2023-ami-2023.*-kernel-6.1-x86_64' Name=state,Values=available \
    --query 'sort_by(Images, &CreationDate)[-1].ImageId')
fi
[[ -n "$AMI" && "$AMI" != "None" ]] || fatal "No se encontró una AMI de Amazon Linux 2023."
info "AMI: $AMI"

# ─────────────────────────────────────────────────────────────
paso "3/6 · Instancia EC2"
ID=$(aws_ ec2 describe-instances \
  --filters Name=tag:Name,Values="$NOMBRE" 'Name=instance-state-name,Values=pending,running,stopped,stopping' \
  --query 'Reservations[0].Instances[0].InstanceId' 2>/dev/null || echo "None")

if [[ "$ID" != "None" && -n "$ID" ]]; then
  info "Ya existe una instancia '$NOMBRE': $ID"
  ESTADO=$(aws_ ec2 describe-instances --instance-ids "$ID" \
    --query 'Reservations[0].Instances[0].State.Name')
  if [[ "$ESTADO" == "stopped" ]]; then
    info "Estaba detenida; arrancándola…"
    aws_ ec2 start-instances --instance-ids "$ID" >/dev/null
  fi
  NUEVA=false
else
  ID=$(aws_ ec2 run-instances \
    --image-id "$AMI" \
    --instance-type "$TIPO" \
    --key-name "$CLAVE" \
    --security-group-ids "$SG" \
    --block-device-mappings "DeviceName=/dev/xvda,Ebs={VolumeSize=$DISCO_GB,VolumeType=gp3,DeleteOnTermination=true}" \
    --user-data "file://$AQUI/user-data.sh" \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$NOMBRE}]" \
    --metadata-options "HttpTokens=required,HttpEndpoint=enabled" \
    --query 'Instances[0].InstanceId')
  info "Lanzada: $ID ($TIPO, ${DISCO_GB} GB)"
  NUEVA=true
fi

info "Esperando a que esté running…"
aws --region "$REGION" ec2 wait instance-running --instance-ids "$ID"

# ─────────────────────────────────────────────────────────────
paso "4/6 · Elastic IP"
# Sin ella la IP pública cambia en cada arranque y el enlace que le pasas
# al cliente se rompe al reanudar la sesión del lab.
EIP=$(aws_ ec2 describe-addresses --filters Name=tag:Name,Values="$NOMBRE" \
  --query 'Addresses[0].PublicIp' 2>/dev/null || echo "None")

if [[ "$EIP" == "None" || -z "$EIP" ]]; then
  ALLOC=$(aws_ ec2 allocate-address --domain vpc --query 'AllocationId')
  aws_ ec2 create-tags --resources "$ALLOC" --tags "Key=Name,Value=$NOMBRE" >/dev/null
  EIP=$(aws_ ec2 describe-addresses --allocation-ids "$ALLOC" --query 'Addresses[0].PublicIp')
  info "Asignada: $EIP"
else
  ALLOC=$(aws_ ec2 describe-addresses --filters Name=tag:Name,Values="$NOMBRE" \
    --query 'Addresses[0].AllocationId')
  info "Reutilizando: $EIP"
fi

aws_ ec2 associate-address --instance-id "$ID" --allocation-id "$ALLOC" >/dev/null
info "Asociada a $ID"

# ─────────────────────────────────────────────────────────────
paso "5/6 · Provisión de la app"
if [[ "$NUEVA" == true ]]; then
  info "cloud-init está instalando Node, MariaDB, nginx y compilando el front."
  info "Tarda entre 5 y 10 minutos. Sondeando…"
  for i in $(seq 1 60); do
    if curl -fsS --max-time 5 "http://$EIP/api/health" >/dev/null 2>&1; then
      info "La API respondió tras ~$((i * 15))s"
      break
    fi
    sleep 15
  done
else
  info "Instancia preexistente: systemd ya levanta los servicios al arrancar."
  sleep 5
fi

# ─────────────────────────────────────────────────────────────
paso "6/6 · Estado"
if curl -fsS --max-time 10 "http://$EIP/api/health" >/dev/null 2>&1; then
  SALUD="\033[1;32mrespondiendo\033[0m"
else
  SALUD="\033[1;33maún no responde\033[0m"
fi

cat <<RESUMEN

$(echo -e "\033[1;32m═══════════════════════════════════════════════\033[0m")
  ANA-vet
  URL:       $(echo -e "\033[1;36mhttp://$EIP\033[0m")
  API:       $(echo -e "$SALUD")
  Instancia: $ID
$(echo -e "\033[1;32m═══════════════════════════════════════════════\033[0m")

  SSH:
    ssh -i ~/Downloads/labsuser.pem ec2-user@$EIP

  Ver la instalación en vivo:
    ssh -i ~/Downloads/labsuser.pem ec2-user@$EIP 'sudo tail -f /var/log/cloud-init-output.log'

  Siguiente paso — crear la clínica de la demo:
    1. Abre http://$EIP/registro y registra la clínica
    2. Cárgale el catálogo de servicios (sin esto no se puede facturar):
       ssh -i ~/Downloads/labsuser.pem ec2-user@$EIP \\
         'cd /opt/anavet/backend/clinica-vet-backend && node scripts/seed-servicios.js EMAIL'

  Al terminar la demo, para no quemar el crédito del lab:
    bash deploy/aws/destroy.sh

RESUMEN
