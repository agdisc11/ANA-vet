# Fase 4 — Innovación (features implementadas)

> Plan y orden de las sub-features: `FASE4_PLAN.md`.
> Estado: **4.1 completa**. 4.2–4.6 pendientes.

---

## 4.1 Búsqueda global (command palette Ctrl+K) ✅

Atajo `Ctrl/Cmd + K` desde cualquier página: busca pacientes y tutores de
la clínica y ofrece acciones de navegación, con navegación por teclado.

### Backend — `GET /api/buscar?q=&limite=`

Capas nuevas siguiendo el patrón del proyecto:

| Capa | Archivo |
|---|---|
| Dominio | `src/domain/Busqueda.js` |
| Repositorios | `PacienteRepository.buscarGlobal()`, `TutorRepository.buscarGlobal()` |
| Servicio | `src/services/BusquedaService.js` |
| Controlador | `src/controllers/buscarController.js` |
| Validador | `src/validators/busquedaSchema.js` |
| Ruta | `src/routes/buscar.js` (montada en `index.js`) |
| DI | `src/container.js` |

**Respuesta:**

```json
{
  "q": "fir",
  "total": 1,
  "resultados": [
    {
      "tipo": "paciente",
      "id": 14,
      "titulo": "Firulais",
      "subtitulo": "Perro · Labrador",
      "detalle": "Tutor: Carlos Mendoza",
      "relevancia": 75,
      "meta": { "especie": "Perro", "raza": "Labrador", "microchip": null,
                "tutor_id": 7, "tutor": "Carlos Mendoza" }
    }
  ]
}
```

**Decisiones de diseño**

- **No hay `BusquedaRepository`.** Cada repositorio sigue siendo el único
  lugar con SQL de su tabla; el servicio los inyecta y unifica. Añadir un
  tipo buscable (p. ej. productos) = un repositorio más en el constructor
  y un mapeador privado.
- **El backend no devuelve rutas de la SPA.** Devuelve `tipo` + `id` +
  textos; el frontend, dueño de su router, los traduce
  (`rutaDeResultado()` en `CommandPalette.jsx`). Cambiar rutas no obliga
  a tocar el backend.
- **Relevancia como regla de negocio** (`Busqueda#relevancia`), no como
  `ORDER BY`: exacta 100, prefijo 75, prefijo de palabra 50, contiene 25.
  Insensible a acentos y mayúsculas en ambos lados (`Busqueda.plegar`).
  Un paciente que casa solo por el nombre de su tutor puntúa la **mitad**:
  sigue apareciendo, pero por debajo de un acierto directo.
- **Consultas de baja latencia**: `buscarGlobal` no reutiliza
  `listarPorClinica` a propósito — pide solo las columnas que pinta el
  palette y evita el `COUNT(*)` de la paginación. Se dispara al teclear.
- Pacientes se buscan también **por microchip**; tutores por teléfono,
  WhatsApp, correo y código (en recepción se identifica por número).

**Seguridad**

- `authMiddleware` + `clinica_id` del token a cada repositorio: ninguna
  consulta puede devolver datos de otra clínica.
- **Escape de comodines** (`Busqueda#patronLike`): `%` y `_` escritos por
  el usuario se escapan antes del LIKE. Sin esto, teclear `%` devolvería
  la tabla entera — el término es dato, no sintaxis.
- Mínimo 2 caracteres (invariante del dominio): por debajo ni se toca la BD.
- `busquedaLimiter` en `middleware/rateLimiters.js` (300/min por IP),
  montado en `index.js` como el resto de limitadores.

**Tests** — 41 nuevos (269 en total, 27 suites):
`tests/domain/Busqueda.test.js`, `tests/services/BusquedaService.test.js`,
`tests/http/buscar.routes.test.js` (este monta el servicio REAL sobre
repositorios fake: cubre Zod → controlador → servicio → dominio).

### Frontend

| Capa | Archivo |
|---|---|
| Servicio | `src/services/busquedaService.js` |
| Hook de datos | `src/hooks/useBusqueda.js` |
| Hook genérico | `src/hooks/useDebounce.js` |
| Utilidad | `src/lib/texto.js` (`plegar`, `encontrarCoincidencia`) |
| Componente | `src/components/CommandPalette.jsx` |
| Montaje | `src/App.jsx` (AppShell) |
| Disparadores | Sidebar ("Buscar… Ctrl K") y header móvil |

- **Dos fuentes en una lista**: acciones locales (filtrado en cliente, sin
  red) + pacientes/tutores del servidor (término *debounced* a 250 ms).
- **Orden de secciones por su mejor coincidencia.** Pintar la lista plana
  del backend tal cual repetiría encabezados al intercalarse los tipos
  (paciente 75, tutor 75, paciente 50 → "Pacientes", "Tutores",
  "Pacientes"); pero un orden fijo enterraría el mejor resultado (buscar
  "mendoza" da tutor 50 y sus pacientes 25, y Enter debe ir al tutor).
  `agruparPorTipo()` mantiene cada sección contigua y las ordena por su
  máximo: un encabezado por sección y el mejor resultado siempre arriba.
- **Teclado en `window`, no en el input** (mismo criterio que `ui/Modal`):
  si el foco se pierde, Escape y las flechas deben seguir funcionando.
  `↑↓`/Tab navegan con wrap-around, `↵` abre, `Esc` cierra.
- **Resaltado insensible a acentos**: `encontrarCoincidencia` pliega
  carácter a carácter y devuelve el mapa de posiciones al texto original
  — plegar cambia la longitud ("José" en NFD ocupa 5 y al quitar el
  acento quedan 4), así que sin el mapa se marcaría el tramo equivocado.
- `placeholderData: (previos) => previos` evita que la lista parpadee a
  vacío entre pulsaciones.

**Rutas de los resultados**

- Paciente → `/expediente/:id`
- Tutor → `/tutores?q=<nombre completo>` (no tiene vista propia)

### Cambios colaterales

- `validators/tipos.js`: se extrajo `enteroEnRango(etiqueta, {defecto, min, max})`,
  que estaba duplicado en `recordatorioSchema.js` (mismos mensajes).
- `pages/Tutores.jsx`: el filtro de la tabla pasó de `searchKeys` a un
  `searchFn` que casa el **nombre completo** e ignora acentos. `nombre` y
  `apellidos` son columnas separadas, así que "Carlos Mendoza" no casaba
  con ninguna por separado — ni tecleado a mano ni vía el deep-link.
- `.claude/launch.json`: se añadió la configuración `backend` (no existía).

### Verificado en navegador

Backend :4000 + front :3000, clínica demo. Comprobado: atajo Ctrl+K,
5 acciones sugeridas al abrir, `GET /api/buscar?q=fi → 200`, resaltado
`<mark>`, agrupación y orden, navegación ↑↓, Enter → `/expediente/15`,
Escape con el foco fuera del input, y el deep-link a tutores filtrando la
tabla. Smoke test del SQL contra MySQL real: `q="%%"` devuelve 0 (el
escape de comodines funciona) y una clínica inexistente devuelve 0.
