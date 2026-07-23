#!/usr/bin/env bash
#
# Activa HTTPS con un certificado gratuito de Let's Encrypt.
#
#   sudo bash deploy/aws/enable-https.sh clinica.midominio.com [correo@dominio.com]
#
# REQUISITOS (esto NO lo hace el script, es previo):
#   1. Tener un dominio (o subdominio) — un .com ronda los $200 MXN/año.
#   2. Un registro DNS tipo A del dominio apuntando a la IP de esta
#      instancia (idealmente la Elastic IP, que no cambia).
#   3. El puerto 80 abierto (ya lo está en el security group).
#
# El certificado se renueva solo (certbot instala su propio timer).
set -euo pipefail

DOMINIO="${1:-${DOMINIO:-}}"
EMAIL="${2:-${EMAIL:-}}"

if [ -z "$DOMINIO" ]; then
  echo "Uso: sudo bash enable-https.sh tu-dominio.com [correo@dominio.com]" >&2
  exit 1
fi
[ -n "$EMAIL" ] || EMAIL="admin@${DOMINIO}"

echo "▶ Verificando que el dominio apunte aquí"
IP_PUBLICA=$(curl -fsS https://checkip.amazonaws.com | tr -d '[:space:]' || echo '')
IP_DOMINIO=$(getent hosts "$DOMINIO" | awk '{print $1}' | head -1 || echo '')
if [ -n "$IP_PUBLICA" ] && [ -n "$IP_DOMINIO" ] && [ "$IP_PUBLICA" != "$IP_DOMINIO" ]; then
  echo "  ⚠ $DOMINIO resuelve a $IP_DOMINIO pero esta instancia es $IP_PUBLICA."
  echo "    Ajusta el registro DNS (tipo A) y espera a que propague, o certbot fallará."
  read -r -p "  ¿Continuar de todos modos? [s/N] " r
  [ "$r" = "s" ] || exit 1
fi

echo "▶ Ajustando server_name de nginx a $DOMINIO"
sudo sed -i "s/server_name .*/server_name ${DOMINIO};/" /etc/nginx/conf.d/anavet.conf
sudo nginx -t
sudo systemctl reload nginx

echo "▶ Instalando certbot y emitiendo el certificado"
sudo dnf install -y -q certbot python3-certbot-nginx
# --redirect: nginx reenvía todo el tráfico HTTP a HTTPS.
sudo certbot --nginx -d "$DOMINIO" --non-interactive --agree-tos -m "$EMAIL" --redirect

# La renovación automática varía de nombre entre distros; se intentan las dos.
sudo systemctl enable --now certbot-renew.timer 2>/dev/null \
  || sudo systemctl enable --now certbot.timer 2>/dev/null || true

echo
echo "✓ HTTPS activo → https://${DOMINIO}"
echo "  (El backend ya acepta el nuevo origen: su CORS permite el mismo-origen automáticamente.)"
