# Fase 3 — Paridad comercial (COMPLETA)

Los 6 módulos que un software veterinario comercial necesita para
competir. Todos con backend en capas (dominio → repositorio → servicio →
controlador), tests y verificación contra la base de datos real.

| # | Módulo | Estado |
|---|---|---|
| 3.1 | Agenda de citas | ✅ |
| 3.2 | Recordatorios por WhatsApp | ✅ |
| 3.3 | Flujo del día (tablero operativo) | ✅ |
| 3.4 | POS ligado a inventario | ✅ |
| 3.5 | Carnet de vacunación digital con QR | ✅ |
| 3.6 | Hoja de tratamiento hospitalario | ✅ |

---

## 3.2 Recordatorios por WhatsApp

**Sin API de pago.** Usa deep-links `wa.me`: se abre WhatsApp (web o app)
con el mensaje ya redactado y el usuario solo pulsa enviar.

- `domain/Recordatorio.js` — lógica pura: normalización de teléfonos a
  formato internacional (`55 1234-5678` → `525512345678`), plantillas de
  mensaje por tipo y cálculo de urgencia.
- Detecta **vacunas por vencer/vencidas** y **citas próximas**, con el
  contacto del tutor.
- Tabla `recordatorio_enviado` (UNIQUE por clínica+tipo+referencia): evita
  reenviar lo mismo y deja historial de contacto. Se puede reactivar.
- Página `/recordatorios`: lista por urgencia, vista previa del mensaje,
  copiar, y botón WhatsApp que además marca el envío.

> Bug corregido aquí: `new Date('2026-07-21')` se parsea como UTC y en
> México (UTC-6) caía el día anterior — un recordatorio de hoy aparecía
> vencido. Las fechas `YYYY-MM-DD` ahora se construyen por componentes locales.

## 3.3 Flujo del día

Tablero operativo (`/flujo`) sobre la máquina de estados de las citas:
**Por llegar → En sala → Atendidas**. Reutiliza el módulo de Agenda sin
backend nuevo.

- Avance de estado con un clic; las transiciones inválidas las rechaza el
  dominio `Cita`.
- Se refresca solo cada 30 s: recepción y consultorio ven lo mismo.
- Filtro por veterinario y acceso directo a cobrar/expediente.

## 3.4 POS ligado a inventario

`recibo_item.producto_id` distingue **servicios** (catálogo) de
**productos** (inventario).

- Al pasar el recibo a `finalizado`, los productos **descuentan stock**
  en una transacción.
- `Recibo.calcularDescuentoStock` agrupa items repetidos del mismo producto.
- `recibo.stock_descontado` hace la operación **idempotente**: finalizar
  dos veces no descuenta doble.
- Control optimista: el `UPDATE … WHERE stock >= ?` impide stock negativo
  con cobros simultáneos. Si falta existencia → **409 con rollback** y el
  mensaje nombra el producto, lo requerido y lo disponible.
- En la UI del recibo los productos aparecen como una categoría más, con
  su stock visible.

## 3.5 Carnet de vacunación digital con QR

- Token opaco de 128 bits por paciente (`paciente.carnet_token`).
- `GET /api/publico/carnet/:token` — **el único endpoint sin sesión**, con
  rate-limit propio. Devuelve mascota, vacunas y clínica; **nunca** datos
  del tutor ni el id interno.
- Página pública `/carnet/:token` optimizada para móvil.
- Modal en Vacunas: QR (imprimible), copiar enlace, enviar por WhatsApp y
  **revocar** (regenerar token invalida el enlace anterior).

## 3.6 Hoja de tratamiento hospitalario

Pensada para **tablet**: checkboxes de 48 px y texto legible a distancia.

- `tratamiento_tarea`: tareas por hora ligadas a la hospitalización, con
  categoría (medicación, fluidos, constantes, alimentación).
- **Firma automática**: al marcar una tarea se registra quién la aplicó y
  cuándo (auditoría clínica).
- `domain/TratamientoTarea.js`: estado por hora (`completada` / `atrasada`
  / `ahora` / `pendiente`, con 15 min de tolerancia), resumen de avance y
  agrupación en cronograma.
- **Pautas repetidas**: "cada 8 h × 3 tomas" genera las tareas
  automáticamente sin cruzar la medianoche.
- Tablero `/api/hospitalizaciones/internados` con el % de avance de cada
  paciente internado.

---

## Verificación

- **228 tests** en verde (24 suites), sin base de datos.
- Smoke tests contra MySQL real: recordatorios (enlace y mensaje), POS
  (13 aserciones, incluido el 409 con rollback), carnet (12, incluida la
  revocación), hoja de tratamiento (10, incluida la pauta).
- Verificación visual en navegador de cada módulo, incluidos los modos
  móvil (carnet) y tablet (hoja de tratamiento).
