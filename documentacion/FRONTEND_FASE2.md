# Frontend Fase 2 — Vite + TanStack Query + Design System

> **Estado: MIGRACIÓN COMPLETA.** Las 20 páginas y los componentes están en el
> patrón nuevo. **Cero llamadas a axios fuera de `src/services/`** (verificado
> por grep). La única excepción intencional es `AuthContext`, que importa `api`
> para gestionar el header del token y el handler de 401 — no hace llamadas a
> endpoints.

## 1. Build: create-react-app → Vite

`react-scripts` (CRA) está descontinuado. Se migró a **Vite 8**:

- Componentes con JSX en archivos `.jsx` (46 renombrados desde `.js`); solo
  JS puro queda como `.js` (`api.js`, `components/agenda/constantes.js`).
- `index.html` en la raíz (no en `public/`), sin `%PUBLIC_URL%`, con
  `<script type="module" src="/src/index.jsx">`.
- `package.json`: `"type": "module"`, scripts `dev`/`build`/`preview` con vite.
  Configs de Tailwind/PostCSS renombrados a `.cjs` (usan `module.exports`).
- `vite.config.js`: `outDir: 'build'` (misma carpeta que CRA, no rompe
  `.claude/launch.json` ni el `serve` del build) y `server.port: 3000`.
- Variables de entorno: `import.meta.env.VITE_*` (antes `process.env.REACT_APP_*`).
  El API usa `import.meta.env.VITE_API_URL` con fallback a `http://localhost:4000/api`.

Arranque en dev: `npm run dev` (Vite, HMR, listo en ~250 ms). Build: `npm run build`.

## 2. Datos: TanStack Query

Reemplaza el patrón `useState + useEffect + función cargar()` que cada página
repetía. Estructura:

```
src/
├── lib/queryClient.js      QueryClient (staleTime 30s, retry inteligente) + mensajeError()
├── services/               ÚNICO lugar que conoce las rutas del API (wrappers de axios)
│   ├── pacientesService.js
│   └── tutoresService.js
└── hooks/                  useQuery / useMutation por dominio
    ├── queryKeys.js        claves de caché centralizadas (evita typos de invalidación)
    ├── usePacientes.js     usePacientes, useCrearPaciente, useActualizarPaciente, useReasignarTutor
    └── useTutores.js
```

`QueryClientProvider` envuelve la app en `App.jsx` (por fuera de todos los
providers de dominio).

### Qué gana cada página migrada

- **Caché compartida**: volver a una lista ya cargada es instantáneo; se
  revalida en segundo plano (staleTime 30s). Navegar Pacientes→Dashboard→
  Pacientes no vuelve a pedir la lista.
- **Invalidación declarativa**: tras crear/editar/reasignar, la mutación llama
  `invalidateQueries` y la lista se refresca sola. Verificado en navegador:
  `POST /pacientes 201` → `GET /pacientes 200` automático, la tabla pasó de 2 a
  3 filas sin recarga.
- **Menos código**: Pacientes perdió 6 `useState` y la función `cargar()`;
  `isLoading`/`isError`/`isPending` vienen de los hooks.
- **DIP en el front**: los componentes dependen de `services/`, no de axios.

## 3. Design system (`src/components/ui/`)

Componentes React estructurales que encapsulan la repetición de cada listado
(las clases Tailwind de `index.css` — `.btn-*`, `.input`, `.table-*`,
`.page-btn` — siguen siendo la capa de tokens; estos componentes las usan).

| Componente | Qué encapsula |
|---|---|
| `PageHeader` | título + subtítulo + acción (botón "Nuevo …") |
| `SearchInput` | input con ícono de lupa (controlado) |
| `DataTable` | thead/tbody + skeleton de carga + empty state; columnas declarativas |
| `Pagination` | paginación controlada (no se muestra con 1 página) |
| `FormPanel` | panel de formulario colapsable con título, cerrar y footer de acciones |
| `FormField` | label + control (input propio o `children`: select/textarea) |
| `Modal` | overlay centrado, cierra con Escape/backdrop, header + footer |

Hook `hooks/useClientTable(data, { searchKeys, searchFn, pageSize })`:
búsqueda + paginación del lado del cliente. Devuelve
`{ query, setQuery, page, setPage, totalPages, filtered, pageItems }`.

**Columnas de `DataTable`** — array de:
```js
{ header, cell: (row) => ReactNode, align?, className?, stopPropagation? }
```
`stopPropagation: true` en la columna de acciones evita disparar `onRowClick`.

Impacto medido: **Pacientes 467 → 330 líneas, Tutores 305 → 230**, y toda la
estructura de tabla/modal/formulario dejó de duplicarse. Verificado en
navegador: búsqueda filtra en vivo (`useClientTable`), crear dispara la
invalidación de caché, el modal comparte `Modal`.

## 4. Patrón para migrar la siguiente página

1. `services/<dominio>Service.js`: mover ahí todas las llamadas `API.x(...)`.
2. Añadir la clave en `hooks/queryKeys.js`.
3. `hooks/use<Dominio>.js`: `useQuery` para lectura, `useMutation` (con
   `invalidateQueries` en `onSuccess`) para escritura.
4. En la página: sustituir `useState`+`useEffect`+`cargar()` por los hooks +
   `useClientTable`; reemplazar el JSX por `PageHeader` / `FormPanel` /
   `SearchInput` / `DataTable` / `Pagination` / `Modal`.
5. `mutateAsync` en los handlers, `mutation.isPending` para botones,
   `mensajeError(error)` para errores (contrato `{ error }` del backend).

**Páginas de referencia (copiar de ahí): `Pacientes.jsx` y `Tutores.jsx`.**

## 5. Mapa de servicios y hooks

| Servicio (`src/services/`) | Hooks (`src/hooks/`) | Páginas |
|---|---|---|
| `pacientesService` | `usePacientes`, `usePaciente` + mutaciones | Pacientes, Expediente, Agenda, Recibo |
| `tutoresService` | `useTutores` + crear/darDeBaja/vetar | Tutores, Pacientes |
| `clinicoService` (consultas, cirugías, hospitalizaciones, vacunas, expedientes) | `useClinico.js` | los 4 listados + las 4 páginas de detalle |
| `adminService` (empleados, roles, inventario, catálogo) | `useAdmin.js` | Empleados, Inventario, Consulta/Cirugía/Hosp. (selector de personal) |
| `dashboardService` (dashboard, stats, calculadora, notificaciones) | `useDashboard.js` | Dashboard, Reportes, Farmacia, Toxicología, NotificacionesBell |
| `reportsService` | — (descarga de blobs) | Reportes, Expediente |
| `recibosService`, `citasService`, `authService` | — | Recibo, Agenda, Login/Registro |

Nota: en las páginas más grandes (Recibo, Agenda, Dashboard, calculadoras) se
migraron las llamadas a la capa de servicios sin reescribir su UI, para no
arriesgar lógica compleja (generador de PDF, calendario, gráficas).

## 6. Estado por página

Todas migradas. Reducciones notables: Empleados 754→290, Pacientes 467→330,
Inventario 472→265, Tutores 305→230. Verificado en navegador tras la migración:
login, Dashboard (KPIs reales), Consultas (fila real), Inventario (2 tablas con
stock correcto), y build de Vite en ~1.5 s.
```
