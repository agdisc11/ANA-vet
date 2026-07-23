#!/usr/bin/env bash
#
# Provisiona ANA-vet completo en UNA instancia EC2 con Amazon Linux 2023.
# Instala Node, MariaDB y nginx; carga el esquema, compila el frontend y
# deja el backend como servicio systemd.
#
#   Ejecutar COMO ec2-user (no como root):
#     curl -fsSL https://raw.githubusercontent.com/agdisc11/ANA-vet/main/deploy/aws/setup-ec2.sh -o setup.sh
#     bash setup.sh
#
# Es idempotente: se puede volver a lanzar para actualizar el despliegue.
# Conserva el .env existente, así que ni la contraseña de la BD ni el
# JWT_SECRET rotan entre ejecuciones (rotar el secreto cerraría todas
# las sesiones abiertas).
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/agdisc11/ANA-vet.git}"
REPO_RAMA="${REPO_RAMA:-main}"
DESTINO="/opt/anavet"
WEB_ROOT="/var/www/anavet"
DB_NOMBRE="clinica_veterinaria"
DB_USUARIO="anavet"
BACKEND_DIR="$DESTINO/backend/clinica-vet-backend"
FRONTEND_DIR="$DESTINO/frontend/clinica-vet-frontend"

paso() { echo -e "\n\033[1;36m▶ $*\033[0m"; }
aviso() { echo -e "\033[1;33m  ! $*\033[0m"; }

if [[ $EUID -eq 0 ]]; then
  echo "No lo ejecutes como root ni con sudo: hazlo como ec2-user." >&2
  echo "El script ya usa sudo donde hace falta." >&2
  exit 1
fi

# ─────────────────────────────────────────────────────────────
paso "1/9 · Paquetes del sistema"
sudo dnf update -y -q

# AL2023 trae varias versiones de Node; se toma la más alta disponible.
if ! command -v node >/dev/null 2>&1; then
  for paquete in nodejs22 nodejs20 nodejs; do
    if sudo dnf install -y -q "$paquete" 2>/dev/null; then
      echo "  Node instalado desde el paquete $paquete"
      break
    fi
  done
fi
command -v node >/dev/null 2>&1 || { echo "No se pudo instalar Node." >&2; exit 1; }
echo "  node $(node --version) · npm $(npm --version)"

sudo dnf install -y -q git nginx mariadb105-server

# ─────────────────────────────────────────────────────────────
paso "2/9 · Swap (el build de Vite no cabe en 1 GB de RAM)"
RAM_MB=$(free -m | awk '/^Mem:/{print $2}')
if [[ "$RAM_MB" -lt 1800 && ! -f /swapfile ]]; then
  sudo dd if=/dev/zero of=/swapfile bs=1M count=2048 status=none
  sudo chmod 600 /swapfile
  sudo mkswap -q /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
  echo "  2 GB de swap añadidos (RAM detectada: ${RAM_MB} MB)"
else
  echo "  No hace falta (RAM: ${RAM_MB} MB)"
fi

# ─────────────────────────────────────────────────────────────
paso "3/9 · MariaDB"
sudo systemctl enable --now mariadb
sudo systemctl is-active --quiet mariadb || { echo "MariaDB no arrancó." >&2; exit 1; }

# ─────────────────────────────────────────────────────────────
paso "4/9 · Código fuente"
sudo mkdir -p "$DESTINO"
sudo chown -R "$USER":"$USER" "$DESTINO"
if [[ -d "$DESTINO/.git" ]]; then
  git -C "$DESTINO" fetch --quiet origin "$REPO_RAMA"
  git -C "$DESTINO" reset --hard --quiet "origin/$REPO_RAMA"
  echo "  Repo actualizado a origin/$REPO_RAMA"
else
  git clone --quiet --branch "$REPO_RAMA" "$REPO_URL" "$DESTINO"
  echo "  Repo clonado"
fi

# ─────────────────────────────────────────────────────────────
paso "5/9 · Credenciales"
ENV_FILE="$BACKEND_DIR/.env"
if [[ -f "$ENV_FILE" ]]; then
  # Se reutilizan para no invalidar sesiones ni desincronizar la BD.
  DB_PASS=$(grep -E '^DB_PASS=' "$ENV_FILE" | cut -d= -f2-)
  JWT_SECRET=$(grep -E '^JWT_SECRET=' "$ENV_FILE" | cut -d= -f2-)
  echo "  .env existente reutilizado"
else
  DB_PASS=$(openssl rand -hex 24)
  JWT_SECRET=$(openssl rand -hex 48)
  echo "  Credenciales nuevas generadas"
fi

cat > "$ENV_FILE" <<ENVEOF
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=$DB_USUARIO
DB_PASS=$DB_PASS
DB_NAME=$DB_NOMBRE
JWT_SECRET=$JWT_SECRET
PORT=4000
NODE_ENV=production
ENVEOF
chmod 600 "$ENV_FILE"
# CORS_ORIGIN se omite a propósito: nginx sirve front y API en el mismo
# origen, así que no hay petición cross-origin que autorizar.

# ─────────────────────────────────────────────────────────────
paso "6/9 · Base de datos"
sudo mysql <<SQLEOF
CREATE DATABASE IF NOT EXISTS \`$DB_NOMBRE\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
CREATE USER IF NOT EXISTS '$DB_USUARIO'@'127.0.0.1' IDENTIFIED BY '$DB_PASS';
ALTER USER '$DB_USUARIO'@'127.0.0.1' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON \`$DB_NOMBRE\`.* TO '$DB_USUARIO'@'127.0.0.1';
FLUSH PRIVILEGES;
SQLEOF

# schema.sql usa CREATE TABLE IF NOT EXISTS y el seed usa INSERT IGNORE:
# recargarlos no destruye datos existentes.
sudo mysql "$DB_NOMBRE" < "$BACKEND_DIR/src/db/schema.sql"
sudo mysql "$DB_NOMBRE" < "$BACKEND_DIR/src/db/seed-catalogos.sql"
TABLAS=$(sudo mysql -N -B -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$DB_NOMBRE'")
echo "  $TABLAS tablas listas"

# ─────────────────────────────────────────────────────────────
paso "7/9 · Backend"
cd "$BACKEND_DIR"
npm ci --omit=dev --silent 2>/dev/null || npm install --omit=dev --silent

sudo cp "$DESTINO/deploy/aws/anavet-backend.service" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --quiet anavet-backend
sudo systemctl restart anavet-backend

# ─────────────────────────────────────────────────────────────
paso "8/9 · Frontend"
cd "$FRONTEND_DIR"
npm ci --silent 2>/dev/null || npm install --silent
# VITE_API_URL=/api NO se pasa por el shell: vive en el .env.production
# del frontend, que Vite carga solo. Así el build sale igual desde
# cualquier máquina (en Git Bash sobre Windows, pasarlo por el entorno
# lo corrompe a "C:/Program Files/Git/api").
npm run build --silent

sudo mkdir -p "$WEB_ROOT"
sudo rm -rf "${WEB_ROOT:?}"/*
sudo cp -r "$FRONTEND_DIR/build/." "$WEB_ROOT/"
sudo chown -R nginx:nginx "$WEB_ROOT"
sudo chmod -R 755 "$WEB_ROOT"

# ─────────────────────────────────────────────────────────────
paso "9/9 · nginx"
sudo cp "$DESTINO/deploy/aws/nginx.conf" /etc/nginx/conf.d/anavet.conf

# El nginx.conf de AL2023 trae su propio server con `listen 80
# default_server`, que choca con el nuestro ("duplicate default server").
# Se le mueve al 8080 en vez de borrarlo. La sustitución es idempotente:
# tras la primera pasada ya no queda ningún "80 default_server".
sudo sed -i -E \
  's/^([[:space:]]*)listen([[:space:]]+)(\[::\]:)?80([[:space:]]+)default_server;/\1listen\2\38080;/' \
  /etc/nginx/nginx.conf

sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx

# SELinux bloquea que nginx haga proxy a localhost si está en enforcing.
sudo setsebool -P httpd_can_network_connect 1 2>/dev/null || true

# ─────────────────────────────────────────────────────────────
TOKEN=$(curl -sS -X PUT "http://169.254.169.254/latest/api/token" \
  -H "X-aws-ec2-metadata-token-ttl-seconds: 300" 2>/dev/null || echo "")
IP=$(curl -sS -H "X-aws-ec2-metadata-token: $TOKEN" \
  http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "TU-IP-PUBLICA")

sleep 2
if curl -fsS "http://127.0.0.1/api/health" >/dev/null 2>&1; then
  ESTADO="\033[1;32mrespondiendo\033[0m"
else
  ESTADO="\033[1;31mSIN RESPUESTA — revisa: sudo journalctl -u anavet-backend -n 50\033[0m"
fi

echo -e "\n\033[1;32m═══════════════════════════════════════════════\033[0m"
echo -e "  ANA-vet desplegado"
echo -e "  URL:    \033[1;36mhttp://$IP\033[0m"
echo -e "  API:    $ESTADO"
echo -e "\033[1;32m═══════════════════════════════════════════════\033[0m"
echo
echo "  Siguiente paso — crear la clínica de la demo:"
echo "    1. Abre http://$IP/registro y registra la clínica"
echo "    2. Carga su catálogo de servicios (si no, no se puede facturar):"
echo "       cd $BACKEND_DIR && node scripts/seed-servicios.js EMAIL-DE-LA-CLINICA"
echo
echo "  Logs:      sudo journalctl -u anavet-backend -f"
echo "  Reiniciar: sudo systemctl restart anavet-backend"
