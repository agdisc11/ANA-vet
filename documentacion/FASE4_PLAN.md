# Fase 4 — Innovación (lo que pone a ANA-vet POR ENCIMA de la competencia)

> Plan de arranque. Las Fases 1-3 están completas (ver ARQUITECTURA_SOLID.md,
> FRONTEND_FASE2.md, FASE3_FEATURES.md). Este documento es el mapa para
> ejecutar la Fase 4 en un contexto limpio.

## Estado del proyecto al empezar la Fase 4

- **Backend**: 100% en capas SOLID, 228 tests, multi-tenant blindado.
  Patrón por módulo: `domain/ → repositories/ → services/ → controllers/`
  cableado en `src/container.js`. Rutas declarativas con validación Zod.
- **Frontend**: Vite + TanStack Query + design system (`components/ui/`).
  Cero axios fuera de `src/services/`. Hooks por dominio en `src/hooks/`.
- **Arranque**: back en :4000 (`npm run dev`), front en :3000 (`npm run dev`
  o launch.json "frontend"). Clínica demo: `demo@anavet.local` /
  `DemoAnaVet2026!`.

---

## Sub-features (orden recomendado)

### 4.1 Búsqueda global Ctrl+K  ✅ COMPLETA — ver `FASE4_FEATURES.md`
Lo más adictivo y de menor riesgo. Command palette que busca pacientes,
tutores y acciones ("nueva consulta a Firulais").
- **Backend**: `GET /api/buscar?q=` — un servicio que consulta pacientes +
  tutores por nombre (LIMIT chico, scoped a la clínica). Reutiliza los
  repositorios existentes; probablemente un `BuscarService` que los inyecta.
- **Frontend**: componente `<CommandPalette>` global montado en AppShell,
  atajo `Ctrl/Cmd+K` (listener en App), `useQuery` con `q` debounced.
  Navega al resultado o dispara una acción.
- Sin migración de BD. 1 sesión.

### 4.2 Autosave de borradores
No perder trabajo en consultas/cirugías/hospitalización.
- **Frontend puro** primero: hook `useAutosave(key, value)` que persiste en
  localStorage con debounce y restaura al montar (banner "Recuperar
  borrador"). Cero backend.
- Opcional fase 2: persistir borradores en servidor.

### 4.3 Calculadoras integradas al flujo
Hoy las 10 calculadoras son una página aislada. Conectarlas:
- Desde una consulta/anestesia, abrir la calculadora con **especie y peso
  del paciente ya precargados** (pasar por query params o contexto).
- Botón "usar resultado" que lo pega en el campo del expediente.
- Es sobre todo frontend (las calculadoras ya existen en
  `components/calculadoras/`). Revisar cómo reciben `pesoKg` (ya lo hacen).

### 4.4 IA sobre el expediente  ⭐ el diferenciador real
Resumen automático del historial, redacción de SOAP desde notas, sugerencia
de diferenciales, "pregúntale al expediente".
- **IMPORTANTE**: cargar la skill `claude-api` ANTES de escribir nada de
  esto (da model ids, pricing, streaming, tool use, caching actuales).
- Usar la **API de Claude** (Anthropic). Modelos: Opus 4.8 / Sonnet 5 /
  Haiku 4.5. Para resúmenes de expediente evaluar Haiku/Sonnet por
  costo-latencia; dejar el model id configurable por env.
- **Backend**: `IaService` que arma el prompt con el expediente (consultas,
  vacunas, dx) y llama a la API con la key en `.env` (NUNCA exponerla al
  front — el front llama a NUESTRO endpoint, no a Anthropic). Rate-limit.
  Considerar streaming (SSE) para el resumen.
- **Frontend**: botón "Resumen IA" en el expediente + panel de chat
  "pregúntale al expediente".
- Multi-tenant: verificar que el paciente es de la clínica antes de mandar
  nada al modelo.

### 4.5 PWA instalable + lectura offline
- `vite-plugin-pwa`: manifest + service worker.
- Cachear el shell y los expedientes recientes (solo lectura) para clínicas
  con internet inestable.
- Ojo: ya hubo un service worker de CRA que causó problemas de caché
  (ver historial); configurar bien el SW de Vite y su actualización.

### 4.6 Microdetalles adictivos
- Foto/avatar de la mascota (subida de imagen; definir almacenamiento).
- Cumpleaños de pacientes del mes en el Dashboard (ya hay `fecha_nacimiento`).
- Atajos de teclado (`N` = nuevo paciente, etc.).
- Animaciones de logro (dar de alta un hospitalizado, recibo cobrado).

---

## Reglas del proyecto (mantener el estándar de las fases 1-3)

1. **Backend**: cada feature con dominio + repo + servicio + controlador +
   validador Zod, cableado en `container.js`. Tests unitarios (dominio +
   servicio con fakes) y, si aplica, smoke test contra MySQL real.
2. **Frontend**: llamadas SOLO en `src/services/`; datos con TanStack Query;
   UI con el design system (`PageHeader`, `DataTable`, `Modal`, `FormField`…).
3. **Verificar en navegador** cada feature (backend en :4000 + front en :3000,
   login demo) y cerrar procesos sin dejar huérfanos (usar el .pid como en
   los smoke tests previos).
4. **Gotchas ya conocidos** (en memoria `fase3-features`): fechas
   `YYYY-MM-DD` se parsean como UTC → construir por componentes locales;
   booleanos MySQL (0/1) → usar `!!` antes de `&&` en JSX; RBAC por nombre
   de rol, nunca por rol_id.

## Migraciones
`node scripts/run-migration.js src/db/migrations/<archivo>.sql`.
Convención de nombres: `YYYY-MM-DD_descripcion.sql`.
