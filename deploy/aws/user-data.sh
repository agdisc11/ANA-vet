#!/usr/bin/env bash
#
# cloud-init: se ejecuta UNA sola vez, como root, al primer arranque de la
# instancia. Su único trabajo es lanzar setup-ec2.sh con el usuario correcto.
#
# No lo ejecutes a mano: lo inyecta provision.sh como --user-data.
#
# Seguimiento en vivo desde la instancia:
#   sudo tail -f /var/log/cloud-init-output.log
set -euxo pipefail

REPO_RAMA="${REPO_RAMA:-main}"
URL_SETUP="https://raw.githubusercontent.com/agdisc11/ANA-vet/$REPO_RAMA/deploy/aws/setup-ec2.sh"

# Esperar a que la red resuelva DNS: cloud-init a veces corre antes.
for _ in $(seq 1 30); do
  curl -fsS https://raw.githubusercontent.com >/dev/null 2>&1 && break
  sleep 2
done

curl -fsSL "$URL_SETUP" -o /home/ec2-user/setup-ec2.sh
chown ec2-user:ec2-user /home/ec2-user/setup-ec2.sh

# setup-ec2.sh se niega a correr como root (usa sudo donde toca), así que
# se invoca como ec2-user. `-l` carga su entorno completo: sin eso npm no
# encuentra su caché ni el HOME correcto.
runuser -l ec2-user -c "bash /home/ec2-user/setup-ec2.sh"

echo "─────────────────────────────────────────────"
echo " ANA-vet aprovisionado por cloud-init"
echo "─────────────────────────────────────────────"
