# Desplegar ANA-vet en AWS Academy Learner Lab

Guía para dejar la app corriendo en una sola instancia EC2 y que un
cliente pueda probarla desde su navegador.

---

## Antes de empezar: la limitación que hay que conocer

**El Learner Lab funciona por sesiones.** La sesión dura unas 4 horas y
al caducar AWS **detiene** la instancia (los datos del disco se
conservan, pero deja de responder). Además, **la IP pública cambia** cada
vez que la instancia arranca, salvo que le asignes una Elastic IP.

Qué significa en la práctica:

| Escenario | ¿Sirve el Learner Lab? |
|---|---|
| Demo agendada, tú con la sesión abierta | **Sí**, perfecto |
| "Te paso el link y lo pruebas esta semana" | **No** — se cae al caducar la sesión |

Si necesitas lo segundo, esto no es el camino: usa un host de verdad
(Railway, Render, Lightsail…) donde la app viva 24/7.

---

## Arquitectura

Todo en **una sola instancia**, y no por pereza: al servir el frontend y
la API desde el mismo origen desaparecen tres problemas de golpe.

```
                    EC2 (Amazon Linux 2023)
   Internet  ─:80─▶ ┌─────────────────────────────────────┐
                    │ nginx                               │
                    │   /       → /var/www/anavet (React) │
                    │   /api/   → 127.0.0.1:4000 ─┐       │
                    │                             ▼       │
                    │                    Express (systemd)│
                    │                             │       │
                    │                             ▼       │
                    │                    MariaDB (local)  │
                    └─────────────────────────────────────┘
```

- **Sin CORS**: mismo origen, no hay petición cross-origin que autorizar.
- **Sin contenido mixto**: no hay un HTTPS llamando a un HTTP.
- **La IP puede cambiar**: el frontend llama a `/api` (ruta relativa), así
  que al reiniciar la sesión **no hay que recompilar nada**.
- MariaDB local evita además configurar puerto y SSL de una BD remota.

> MariaDB en vez de MySQL porque es la que trae AL2023 de fábrica. Está
> verificado que el esquema es compatible: usa `utf8mb4_general_ci` y
> `utf8mb4_unicode_ci`, y ninguna consulta del proyecto usa sintaxis
> exclusiva de MySQL 8 (ni window functions, ni CTEs, ni `JSON_TABLE`).

---

## Opción A · Automático (un comando)

Crea el security group, la instancia, la Elastic IP y provisiona la app
entera. Es idempotente: relanzarlo reutiliza lo que ya exista.

### A.1 · Instalar y configurar el AWS CLI (solo la primera vez)

Windows:

```powershell
winget install --id Amazon.AWSCLI -e
```

Luego, en el Learner Lab: **AWS Details → AWS CLI → Show**. Copia el
bloque que aparece y pégalo tal cual en `~/.aws/credentials`
(`C:\Users\TU-USUARIO\.aws\credentials`). Tiene esta forma:

```ini
[default]
aws_access_key_id=...
aws_secret_access_key=...
aws_session_token=...
```

> Esas credenciales **caducan al terminar la sesión del lab**. Cada vez
> que hagas *Start Lab* hay que volver a copiarlas, o los scripts fallarán
> con "credenciales no válidas o caducadas".

Comprueba que funciona:

```bash
aws sts get-caller-identity
```

### A.2 · Desplegar

```bash
bash deploy/aws/provision.sh
```

Tarda entre 5 y 10 minutos (casi todo es compilar el frontend). Al
terminar imprime la URL pública. Puedes seguir la instalación en vivo con:

```bash
ssh -i ~/Downloads/labsuser.pem ec2-user@LA-IP 'sudo tail -f /var/log/cloud-init-output.log'
```

### A.3 · Al terminar la demo

```bash
bash deploy/aws/destroy.sh
```

**Hazlo.** Una Elastic IP sin asociar se cobra por hora aunque la
instancia esté apagada, y el crédito del lab es finito. El script pide
confirmación escribiendo `BORRAR` antes de tocar nada.

---

## Opción B · Manual, por la consola web

### B.1 · Crear la instancia

En la consola del Learner Lab (**AWS Details → AWS Console**):

1. **EC2 → Launch instance**
2. **AMI**: Amazon Linux 2023
3. **Tipo**: `t3.small` (2 GB de RAM).
   Con `t3.micro` (1 GB) también funciona: el script crea 2 GB de swap
   automáticamente porque el build de Vite no cabe en 1 GB.
4. **Key pair**: `vockey` (la que ya existe en el lab)
5. **Security group** — reglas de entrada:

   | Tipo | Puerto | Origen | Para qué |
   |---|---|---|---|
   | HTTP | 80 | `0.0.0.0/0` | que tu cliente entre |
   | SSH | 22 | *My IP* | que entres tú |

6. **Storage**: 16 GB (los 8 por defecto se quedan cortos con `node_modules`)

---

### B.2 · Conectarse

Descarga `labsuser.pem` desde **AWS Details → Download PEM**.

En Linux o macOS:

```bash
chmod 400 labsuser.pem
ssh -i labsuser.pem ec2-user@LA-IP-PUBLICA
```

En **Windows** `chmod` no sirve: OpenSSH mira las ACL y rechaza la clave
con *"UNPROTECTED PRIVATE KEY FILE"*. Hay que quitarle la herencia y
dejarte solo a ti (en PowerShell):

```powershell
icacls "$env:USERPROFILE\Downloads\labsuser.pem" /inheritance:r /grant:r "$($env:USERNAME):(R)"
```

### B.3 · Instalar

```bash
curl -fsSL https://raw.githubusercontent.com/agdisc11/vetapp/main/deploy/aws/setup-ec2.sh -o setup.sh && bash setup.sh
```

Tarda unos 5-10 minutos. El script instala Node, MariaDB y nginx, carga
el esquema, compila el frontend y deja el backend como servicio systemd.
Al terminar imprime la URL.

**Es idempotente**: puedes relanzarlo para actualizar el despliegue tras
un `git push`. Conserva el `.env`, así que ni la contraseña de la BD ni
el `JWT_SECRET` rotan (rotar el secreto cerraría todas las sesiones).

---

## Crear la clínica de la demo

Este paso es el mismo con cualquiera de las dos opciones.

El despliegue deja la base con el esquema y los catálogos globales
(medicamentos y toxicología, que alimentan las calculadoras), pero **sin
ninguna clínica**: eso se hace desde la app.

1. Abre `http://LA-IP/registro` y registra la clínica.
2. Cárgale el catálogo de servicios:

```bash
cd /opt/anavet/backend/clinica-vet-backend && node scripts/seed-servicios.js EMAIL-DE-LA-CLINICA
```

> Este segundo paso **no es opcional para una demo**: registrar una
> clínica siembra sus roles pero no su `servicio_catalogo`, y como no hay
> pantalla para dar servicios de alta, sin esto no se puede emitir ningún
> recibo.

---

## Reanudar tras caducar la sesión

Esto es lo que harás cada vez que vuelvas al lab.

1. **Start Lab**.
2. Vuelve a copiar las credenciales del CLI (**AWS Details → AWS CLI**):
   las anteriores ya caducaron.
3. Arranca la instancia:

```bash
bash deploy/aws/provision.sh
```

Detecta que la instancia ya existe, la arranca, le reasocia la Elastic IP
y espera a que responda. **La URL es la misma de siempre.**

A mano sería: **EC2 → Instances →** seleccionar **→ Instance state →
Start**, y si no hay Elastic IP, copiar la IP pública nueva.

No hay que recompilar nada: nginx, MariaDB y el backend arrancan solos
con la instancia (systemd), y el frontend llama a la API por ruta
relativa.

Si algo no responde:

```bash
sudo systemctl status anavet-backend nginx mariadb
sudo journalctl -u anavet-backend -n 50
```

### Sobre la Elastic IP

`provision.sh` la crea y la asocia sola, para que el enlace que le pasas
al cliente no cambie entre sesiones. Si vas por la opción manual: EC2 →
Elastic IPs → Allocate → Associate.

En ambos casos, **libérala al terminar**: una Elastic IP sin asociar se
cobra por hora aunque la instancia esté apagada. `destroy.sh` lo hace.

---

## Sobre HTTPS

El despliegue va por **HTTP**. El navegador marcará "No seguro" y avisará
en el campo de contraseña. Funciona, pero no luce.

Para una demo supervisada es aceptable. Si necesitas HTTPS, la vía es un
dominio real + Let's Encrypt (`certbot`), y con una IP que cambia cada
sesión eso se vuelve incómodo — a esas alturas conviene más un host de
verdad. **No metas datos reales de pacientes ni de clientes** en un
despliegue por HTTP.

---

## Problemas frecuentes

| Síntoma | Causa y solución |
|---|---|
| La página no carga | Falta la regla de entrada del puerto 80 en el security group |
| La página carga pero todo falla | Backend caído: `sudo journalctl -u anavet-backend -n 50` |
| `502 Bad Gateway` | Express no está escuchando: `sudo systemctl restart anavet-backend` |
| `nginx: duplicate default server` | El script ya lo resuelve moviendo el server por defecto de AL2023 al 8080; si aparece, relánzalo |
| El build se queda colgado o muere | Falta RAM. El script crea swap solo si detecta menos de 1.8 GB; verifica con `free -h` |
| Recargar en `/pacientes` da 404 | Falta el `try_files` de la SPA: revisa que `/etc/nginx/conf.d/anavet.conf` esté puesto |
| La app dice "credenciales incorrectas" siempre | El `JWT_SECRET` cambió y las sesiones viejas no valen: borra el localStorage del navegador |

---

## Comandos útiles

```bash
sudo journalctl -u anavet-backend -f          # logs en vivo
sudo systemctl restart anavet-backend         # reiniciar API
curl -s localhost/api/health                  # ¿responde el backend?
sudo mysql clinica_veterinaria -e "SELECT id, nombre, email FROM clinicas"
```

Actualizar tras un `git push`:

```bash
cd /opt/anavet && bash deploy/aws/setup-ec2.sh
```

---

## Coste

Solo se consume presupuesto mientras la instancia está **running**: al
caducar la sesión se detiene sola. Una `t3.small` ronda los $0.02/hora,
así que unas pocas demos apenas rozan el crédito del lab. Lo único que
sigue costando con la instancia apagada es el disco EBS (céntimos al mes)
y cualquier Elastic IP sin asociar.
