# Arquitectura en capas (POO + SOLID) — Backend ANA-vet

> **Estado: MIGRACIÓN COMPLETA (2026-07-20).** Los 18 módulos del backend están
> en la arquitectura en capas: no queda SQL en rutas ni handlers con callbacks.
>
> Blindajes de seguridad aplicados durante la migración total:
> - `/api/stats` exigía **cero autenticación** y contaba datos de TODAS las
>   clínicas → ahora requiere token y filtra por clínica.
> - `/api/calculadora/*` era público → ahora requiere sesión.
> - `POST /api/anestesia` aceptaba cualquier `cirugia_id` (cross-tenant) →
>   ahora verifica pertenencia vía expediente.
> - Los `empleados_ids` de cirugías/hospitalizaciones se insertan con
>   `INSERT…SELECT` filtrado por clínica: imposible asignar personal ajeno.
> - `consulta.empleado_id` y `recibo.empleado_id` verifican pertenencia.
>
> El módulo **auth** aporta dos piezas de infraestructura inyectables:
> `src/auth/passwords.js` (bcrypt + password temporal) y `src/auth/tokens.js`
> (única definición del payload JWT de cada tipo de sesión). Los servicios
> ClinicaService/EmpleadoService las reciben por constructor, así los tests
> corren sin criptografía real. La generación del correo corporativo
> (nombre.apellido@anavet-N.com con resolución de colisiones) es lógica PURA
> en `domain/Empleado.js`. Los roles semilla viven en `domain/Clinica.js`
> (ROLES_DEFAULT) — si cambian, actualizar también `auth/permisos.js`.
>
> El módulo **recibos** es el ejemplo de un AGREGADO: `domain/Recibo.js` (raíz)
> + `ReciboItem` (objeto de valor). El total se calcula solo en el dominio
> (nunca se confía en el cliente) y `ReciboRepository` persiste recibo + items
> con `withTransaction` (commit/rollback automáticos, adiós callbacks anidados).
> De paso se corrigió un bug latente: `GET /recibos/:id/detalle` consultaba
> `t.email`, columna inexistente (la tabla tutor usa `correo`) — el endpoint
> respondía 500 desde siempre.
>
> El módulo **citas** es además el ejemplo de una entidad rica: `domain/Cita.js`
> modela el ciclo de vida como máquina de estados (programada → confirmada →
> en_sala → atendida / cancelada / no_asistio) y `CitaService` garantiza que un
> veterinario no tenga citas traslapadas (409 con el detalle del choque).
> Su tabla se crea con `node scripts/run-migration.js src/db/migrations/2026-07-20_create_cita.sql`.

## Estructura

```
src/
├── domain/            Entidades con comportamiento y reglas de negocio puras
│   └── Paciente.js        edad, esCachorro(), invariantes (fecha no futura…)
├── repositories/      TODO el SQL vive aquí, y solo aquí
│   ├── BaseRepository.js  CRUD genérico multi-tenant (clinica_id OBLIGATORIO)
│   ├── PacienteRepository.js
│   └── TutorRepository.js
├── services/          Lógica de negocio y orquestación (sin HTTP, sin SQL)
│   └── PacienteService.js
├── controllers/       Solo HTTP: parsear petición → servicio → respuesta
│   └── pacientesController.js   (factory con inyección de dependencias)
├── validators/        Esquemas Zod (DTO) con mensajes en español
│   ├── tipos.js           constructores reutilizables (textoRequerido, idRequerido…)
│   └── pacienteSchema.js
├── middleware/
│   ├── asyncHandler.js    elimina los try/catch de los controladores
│   ├── validate.js        validate(schema) / validateQuery(schema)
│   ├── rateLimiters.js    anti fuerza-bruta en login/registro
│   ├── authMiddleware.js  JWT (legacy, sigue vigente)
│   └── errorHandler.js    respuesta uniforme { error } (ya existía)
├── errors/
│   └── ApiError.js        ValidationError(400), NotFoundError(404), ForbiddenError(403), ConflictError(409)
├── auth/
│   └── permisos.js        RBAC por NOMBRE de rol + requierePermiso(permiso)
├── db/
│   └── connection.js      pool mysql2: `db` (callbacks, legacy) + `pool`/`query`/`withTransaction` (promesas)
└── container.js       Composition root: aquí se cablean las dependencias
```

## Flujo de una petición (módulo migrado)

```
Ruta → authMiddleware → validate(schema Zod) → Controller → Service → Repository → MySQL
                                                   │            │
                                                   │            └── Entidad de dominio (invariantes)
                                                   └── errores tipados → errorHandler global → { error }
```

## Cómo se cumple SOLID

| Principio | Dónde se ve |
|---|---|
| **S**RP | Cada capa tiene una sola razón de cambio: HTTP (controller), negocio (service), SQL (repository), reglas clínicas (domain), formato de entrada (validators). |
| **O**CP | Nuevos permisos → solo se edita `PERMISOS_POR_ROL` en `auth/permisos.js`. Nuevos mensajes de error MySQL → solo `MYSQL_ERROR_MAP` en `errorHandler.js`. Nuevos tipos de campo → `validators/tipos.js`. |
| **L**SP | Cualquier `BaseRepository` concreto es sustituible donde se espere la base (`existeEnClinica`, `insert`, …) sin romper al consumidor. |
| **I**SP | Los servicios reciben solo los repositorios que usan; los fakes de test implementan únicamente los métodos consumidos. |
| **D**IP | Controladores y servicios dependen de abstracciones inyectadas (factories/constructores). El único lugar que conoce implementaciones concretas es `container.js`. Por eso los tests corren **sin MySQL**. |

## Garantías que aporta la base

- **Multi-tenant estructural**: todos los métodos de `BaseRepository` exigen `clinicaId` como parámetro; no existe forma de consultar/modificar sin filtrar por clínica. Además `PacienteService` verifica que `tutor_id` pertenezca a la clínica (antes se aceptaba cualquier id, incluso de otra clínica).
- **RBAC correcto**: la autorización compara el **nombre** del rol (estable, sembrado por clínica), no `rol_id === 2` — los IDs de `roles` son AUTO_INCREMENT globales y el 2 solo era "Veterinario" en la primera clínica. El login de empleados ahora incluye `rol_nombre` en el JWT; tokens viejos caen a un lookup en BD con caché de 60 s.
- **Errores uniformes**: los servicios lanzan errores tipados (`NotFoundError`, etc.); nadie escribe `res.status(500)` a mano ni try/catch en controladores (`asyncHandler`).
- **Validación declarativa**: Zod normaliza además de validar (trim, `''`→`null`, `'5'`→`5`, ISO con hora → `YYYY-MM-DD`) y descarta claves desconocidas.
- **Anti fuerza-bruta**: `loginLimiter` (10 intentos fallidos / 15 min / IP, los éxitos no cuentan) y `registroLimiter` (5/h) montados en `index.js`, más `helmet` para cabeceras de seguridad.
- **Transacciones sin boilerplate**: `withTransaction(async (tx) => { … })` con commit/rollback/release automáticos (usar al migrar recibos y registro de clínicas).

## Compatibilidad con el frontend actual

- `GET /api/pacientes` sin `?page` responde el **arreglo completo** (contrato legacy). Con `?page=&limit=&q=` responde `{ data, pagination }`. El frontend actual no envía `page`, así que nada se rompe; la paginación queda lista para adoptarse.
- Los cuerpos de respuesta se mantienen: `{ id, mensaje }` al crear, `{ mensaje }` en update/delete/reasignar, `{ error }` en fallos.
- Cambio menor deliberado: `POST /api/pacientes` ahora responde `201` (antes `200`); axios trata igual cualquier 2xx.

## Tests (`npm test`)

- `tests/domain/` — entidad pura, sin mocks.
- `tests/services/` — servicio con repositorios fake (demuestra DIP).
- `tests/validators/` — normalización y mensajes de los esquemas.
- `tests/http/` — supertest con router real + auth real + Zod real + errorHandler real y servicio fake: integración completa **sin base de datos**.

## Checklist para AGREGAR un módulo nuevo (la migración ya terminó)

1. **Validator**: `src/validators/tutorSchema.js` usando `validators/tipos.js`.
2. **Entidad** (si tiene reglas propias): `src/domain/Tutor.js`.
3. **Repositorio**: mover el SQL de la ruta a `TutorRepository` (ya existe el esqueleto); los métodos nuevos reciben siempre `clinicaId`.
4. **Servicio**: `src/services/TutorService.js` con las reglas (p. ej. vetar ≠ eliminar) lanzando errores tipados.
5. **Controlador**: factory `crearTutoresController({ tutorService })` con `asyncHandler`.
6. **Container**: registrar repo/servicio/controlador en `src/container.js`.
7. **Ruta**: dejarla declarativa (`auth → validate → controller`) e exportar también la factory del router para tests.
8. **Tests**: copiar la estructura de los 4 archivos de pacientes.
9. Verificar en el frontend qué claves de respuesta consume antes de tocar cualquier contrato.

Migración completada en este orden: pacientes → tutores → citas → recibos → auth (clinicas/empleados) → expedientes/consultas → hospitalizaciones/cirugías/anestesia/vacunas → roles/inventario/servicios-catalogo → dashboard/stats/calculadora/reports. **Todos ✔.**

## Datos de demostración

Existe una clínica demo para probar la Agenda sin tocar datos reales
(multi-tenant: no ve ni afecta a las demás clínicas):

- **Email:** `demo@anavet.local` · **Password:** `DemoAnaVet2026!`
- Incluye: veterinaria Sofía Ramírez, tutor Carlos Mendoza (con WhatsApp) y
  pacientes Firulais (Perro) y Luna (Gato) con citas de ejemplo.
- Se regenera con el script de semilla si se borra (los datos se crean vía API).
