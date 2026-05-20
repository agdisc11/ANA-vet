# DOC_BASE_DATOS.md — Documentación de Base de Datos
## Proyecto ANA-VET · Sistema SaaS Veterinario

---

## 1. Visión General

La base de datos `clinica_veterinaria` está implementada en **MariaDB 10.4 / MySQL** con codificación `utf8mb4` (soporte completo de Unicode). El modelo soporta **multi-tenancy** (múltiples clínicas independientes) mediante la columna `clinica_id` presente en la mayoría de las tablas, garantizando aislamiento total de datos entre tenants.

**Motor:** InnoDB (soporte de transacciones y claves foráneas)  
**Charset:** utf8mb4 / utf8mb4_general_ci  
**Total de tablas:** 22

---

## 2. Diagrama de Entidades (Descripción Textual)

```
clinicas (tenant raíz)
  ├── roles (1:N)
  ├── empleados (1:N) → roles
  ├── tutor (1:N)
  │     └── paciente (1:N)
  │           ├── expediente (1:N)
  │           │     ├── consulta (1:N) → empleados
  │           │     │     ├── diagnostico (1:N)
  │           │     │     └── tratamiento (1:N)
  │           │     ├── hospitalizacion (1:N)
  │           │     │     ├── hospitalizacion_empleados (N:M) → empleados
  │           │     │     ├── seguimiento_hospitalizacion (1:N)
  │           │     │     └── alta (1:N)
  │           │     └── cirugia (1:N)
  │           │           ├── cirugia_empleados (N:M) → empleados
  │           │           └── anestesia (1:1)
  │           └── vacuna (1:N)
  ├── recibo (1:N) → paciente, expediente, empleados
  │     └── recibo_item (1:N) → servicio_catalogo
  ├── servicio_catalogo (1:N)
  ├── inventario (1:N)
  └── solicitud_reabastecimiento (1:N) → empleados

-- Tablas globales (sin clinica_id):
catalogo_medicamentos
catalogo_toxicologia
```

---

## 3. Descripción Detallada de Tablas

### 3.1 `clinicas` — Tabla Maestra de Tenants

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | INT(11) | PK, AUTO_INCREMENT | Identificador único del tenant |
| `nombre` | VARCHAR(150) | NOT NULL | Nombre comercial de la clínica |
| `email` | VARCHAR(150) | NOT NULL, UNIQUE (`uq_clinica_email`) | Correo de acceso/login |
| `password_hash` | VARCHAR(255) | NOT NULL | Contraseña hasheada con bcrypt (10 rounds) |
| `telefono` | VARCHAR(20) | NULL | Teléfono de contacto |
| `direccion` | VARCHAR(255) | NULL | Dirección física |
| `logo_url` | VARCHAR(500) | NULL | URL o ruta del logo |
| `activa` | TINYINT(1) | NOT NULL, DEFAULT 1 | 1=activa, 0=suspendida |
| `created_at` | TIMESTAMP | DEFAULT current_timestamp() | Fecha de registro |
| `updated_at` | TIMESTAMP | ON UPDATE current_timestamp() | Última modificación |

**Índices:** PK(`id`), UNIQUE(`email`)

---

### 3.2 `roles` — Roles por Clínica

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | INT(11) | PK, AUTO_INCREMENT | |
| `clinica_id` | INT(11) | NOT NULL, FK → clinicas | Tenant propietario |
| `nombre` | VARCHAR(100) | NOT NULL | Ej: Administrador, Veterinario |
| `descripcion` | TEXT | NULL | Descripción de permisos |
| `created_at` | TIMESTAMP | DEFAULT current_timestamp() | |

**Índices:** PK(`id`), KEY `idx_roles_clinica`(`clinica_id`)  
**FK:** `roles_ibfk_clinica` → `clinicas(id)` ON DELETE CASCADE  
**Roles por defecto** (creados automáticamente al registrar clínica): Administrador, Veterinario, Recepcionista, Auxiliar

---

### 3.3 `empleados` — Personal de la Clínica

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | INT(11) | PK, AUTO_INCREMENT | |
| `clinica_id` | INT(11) | NOT NULL, FK → clinicas | Tenant propietario |
| `rol_id` | INT(11) | NOT NULL, FK → roles | Puesto del empleado |
| `nombre` | VARCHAR(100) | NOT NULL | |
| `apellidos` | VARCHAR(150) | NOT NULL | |
| `email` | VARCHAR(150) | NOT NULL, UNIQUE (`uq_empleado_email`) | Correo de login |
| `password_hash` | VARCHAR(255) | NOT NULL | bcrypt |
| `telefono` | VARCHAR(20) | NULL | |
| `activo` | TINYINT(1) | NOT NULL, DEFAULT 1 | 1=activo, 0=baja |
| `created_at` | TIMESTAMP | DEFAULT current_timestamp() | |
| `updated_at` | TIMESTAMP | ON UPDATE current_timestamp() | |

**Índices:** PK(`id`), UNIQUE(`email`), KEY `idx_empleados_clinica`(`clinica_id`), KEY `idx_empleados_rol`(`rol_id`)  
**FK:** `empleados_ibfk_clinica` → `clinicas(id)` ON DELETE CASCADE; `empleados_ibfk_rol` → `roles(id)`

---

### 3.4 `tutor` — Propietarios de Mascotas

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | INT(11) | PK, AUTO_INCREMENT | |
| `clinica_id` | INT(11) | NULL, FK → clinicas | Tenant (SET NULL si se elimina clínica) |
| `nombre` | VARCHAR(100) | NOT NULL | |
| `apellidos` | VARCHAR(150) | NOT NULL | |
| `telefono` | VARCHAR(20) | NULL | |
| `whatsapp` | VARCHAR(20) | NULL | |
| `correo` | VARCHAR(100) | NULL | |
| `direccion` | VARCHAR(255) | NULL | |
| `codigo` | VARCHAR(30) | UNIQUE | Código único generado: `TUT-{timestamp}-{random}` |
| `tags` | VARCHAR(255) | NULL | Etiquetas libres |
| `vetado` | TINYINT(1) | DEFAULT 0 | Flag de veto |
| `estatus` | ENUM('activo','inactivo','vetado') | DEFAULT 'activo' | Estado del tutor |
| `created_at` | TIMESTAMP | DEFAULT current_timestamp() | |

**Índices:** PK(`id`), UNIQUE(`codigo`), KEY `idx_tutor_clinica`(`clinica_id`)  
**FK:** `tutor_ibfk_clinica` → `clinicas(id)` ON DELETE SET NULL

---

### 3.5 `paciente` — Animales Registrados

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | INT(11) | PK, AUTO_INCREMENT | |
| `clinica_id` | INT(11) | NULL, FK → clinicas | Tenant |
| `tutor_id` | INT(11) | NOT NULL, FK → tutor | Propietario |
| `nombre` | VARCHAR(100) | NOT NULL | Nombre del animal |
| `especie` | VARCHAR(50) | NOT NULL | Ej: Perro, Gato |
| `raza` | VARCHAR(100) | NULL | |
| `sexo` | ENUM('Macho','Hembra') | NOT NULL | |
| `fecha_nacimiento` | DATE | NULL | |
| `funcion_zootecnica` | VARCHAR(100) | NULL | Ej: Mascota, Trabajo |
| `tatuaje` | VARCHAR(50) | NULL | Identificación por tatuaje |
| `microchip` | VARCHAR(50) | NULL | Número de microchip |
| `esquemas_preventivos` | TEXT | NULL | Historial de esquemas |
| `created_at` | TIMESTAMP | DEFAULT current_timestamp() | |

**Índices:** PK(`id`), KEY `tutor_id`(`tutor_id`), KEY `idx_paciente_clinica`(`clinica_id`)  
**FK:** `paciente_ibfk_1` → `tutor(id)` ON DELETE CASCADE; `paciente_ibfk_clinica` → `clinicas(id)` ON DELETE SET NULL

---

### 3.6 `expediente` — Expediente Médico

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | INT(11) | PK, AUTO_INCREMENT | |
| `clinica_id` | INT(11) | NULL, FK → clinicas | Tenant |
| `paciente_id` | INT(11) | NOT NULL, FK → paciente | |
| `fecha_apertura` | DATE | NOT NULL, DEFAULT curdate() | |
| `anamnesis` | TEXT | NULL | Historia clínica inicial |
| `examen_fisico` | TEXT | NULL | |
| `examenes_sistemicos` | TEXT | NULL | |
| `lista_problemas` | TEXT | NULL | |
| `dx_presuntivo` | TEXT | NULL | Diagnóstico presuntivo |
| `abordaje_dx` | TEXT | NULL | |
| `dx_definitivo` | TEXT | NULL | Diagnóstico definitivo |

**Índices:** PK(`id`), KEY `paciente_id`(`paciente_id`), KEY `idx_expediente_clinica`(`clinica_id`)  
**FK:** `expediente_ibfk_1` → `paciente(id)` ON DELETE CASCADE; `expediente_ibfk_clinica` → `clinicas(id)` ON DELETE SET NULL

---

### 3.7 `consulta` — Consultas Veterinarias

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | INT(11) | PK, AUTO_INCREMENT | |
| `expediente_id` | INT(11) | NOT NULL, FK → expediente | |
| `empleado_id` | INT(11) | NULL, FK → empleados | Veterinario que atiende |
| `fecha` | DATE | NOT NULL | |
| `motivo` | TEXT | NULL | Motivo de consulta |
| `anamnesis` | TEXT | NULL | |
| `examen_fisico` | TEXT | NULL | |
| `examenes_sistemicos` | TEXT | NULL | |
| `lista_problemas` | TEXT | NULL | |
| `dx_presuntivo` | TEXT | NULL | |
| `abordaje_dx` | TEXT | NULL | |
| `tratamiento` | TEXT | NULL | |
| `dx_definitivo` | TEXT | NULL | |
| `tratamiento_etiologico` | TEXT | NULL | |
| `indicaciones` | TEXT | NULL | |
| `seguimiento_medico` | TEXT | NULL | |
| `resumen` | TEXT | NULL | |

**Índices:** PK(`id`), KEY `expediente_id`(`expediente_id`), KEY `idx_consulta_empleado`(`empleado_id`)  
**FK:** `consulta_ibfk_1` → `expediente(id)` ON DELETE CASCADE; `consulta_ibfk_empleado` → `empleados(id)` ON DELETE SET NULL

---

### 3.8 `diagnostico` — Diagnósticos de Consulta

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | INT(11) | PK, AUTO_INCREMENT | |
| `consulta_id` | INT(11) | NOT NULL, FK → consulta | |
| `descripcion` | TEXT | NOT NULL | |
| `tipo` | ENUM('Presuntivo','Definitivo') | DEFAULT 'Presuntivo' | |

**FK:** `diagnostico_ibfk_1` → `consulta(id)` ON DELETE CASCADE

---

### 3.9 `tratamiento` — Tratamientos de Consulta

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | INT(11) | PK, AUTO_INCREMENT | |
| `consulta_id` | INT(11) | NOT NULL, FK → consulta | |
| `medicamento` | VARCHAR(150) | NOT NULL | |
| `dosis` | VARCHAR(100) | NULL | |
| `via` | VARCHAR(50) | NULL | Vía de administración |
| `duracion_dias` | INT(11) | NULL | |

**FK:** `tratamiento_ibfk_1` → `consulta(id)` ON DELETE CASCADE

---

### 3.10 `hospitalizacion` — Hospitalizaciones

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | INT(11) | PK, AUTO_INCREMENT | |
| `expediente_id` | INT(11) | NOT NULL, FK → expediente | |
| `fecha_ingreso` | DATE | NOT NULL | |
| `historia_clinica` | TEXT | NULL | |
| `abordaje_hospitalario` | TEXT | NULL | |
| `tratamiento_intrahospitalario` | TEXT | NULL | |
| `abordaje_diagnostico` | TEXT | NULL | |
| `seguimiento` | TEXT | NULL | |
| `revaloraciones` | TEXT | NULL | |
| `ajuste_plan_terapeutico` | TEXT | NULL | |
| `plan_diagnostico` | TEXT | NULL | |
| `tipo_alta` | VARCHAR(50) | NULL | Ej: Alta médica |
| `acta_responsiva` | TINYINT(1) | NULL | |

**FK:** `hospitalizacion_ibfk_1` → `expediente(id)` ON DELETE CASCADE

---

### 3.11 `hospitalizacion_empleados` — Tabla Puente N:M

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `hospitalizacion_id` | INT(11) | PK compuesta, FK → hospitalizacion |
| `empleado_id` | INT(11) | PK compuesta, FK → empleados |

**PK compuesta:** (`hospitalizacion_id`, `empleado_id`)  
**FK:** ON DELETE CASCADE en ambas columnas

---

### 3.12 `seguimiento_hospitalizacion` — Seguimiento Diario

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INT(11) | PK, AUTO_INCREMENT |
| `hospitalizacion_id` | INT(11) | FK → hospitalizacion |
| `fecha` | DATE | NOT NULL |
| `revaloracion` | TEXT | NULL |
| `ajuste_terapeutico` | TEXT | NULL |
| `plan_diagnostico` | TEXT | NULL |

**FK:** ON DELETE CASCADE → hospitalizacion

---

### 3.13 `alta` — Registro de Alta Hospitalaria

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INT(11) | PK, AUTO_INCREMENT |
| `hospitalizacion_id` | INT(11) | FK → hospitalizacion |
| `fecha` | DATE | NOT NULL |
| `tipo` | ENUM('Alta médica','Alta condicionada','Alta voluntaria') | NOT NULL |
| `indicaciones` | TEXT | NULL |

**FK:** ON DELETE CASCADE → hospitalizacion

---

### 3.14 `cirugia` — Procedimientos Quirúrgicos

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | INT(11) | PK, AUTO_INCREMENT | |
| `expediente_id` | INT(11) | NOT NULL, FK → expediente | |
| `fecha` | DATE | NOT NULL | |
| `procedimiento` | VARCHAR(200) | NOT NULL | Nombre del procedimiento |
| `plan_quirurgico` | TEXT | NULL | |
| `notas` | TEXT | NULL | |
| `consentimiento` | TEXT | NULL | Texto del consentimiento |

**FK:** `cirugia_ibfk_1` → `expediente(id)` ON DELETE CASCADE

---

### 3.15 `cirugia_empleados` — Tabla Puente N:M

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `cirugia_id` | INT(11) | PK compuesta, FK → cirugia |
| `empleado_id` | INT(11) | PK compuesta, FK → empleados |

**PK compuesta:** (`cirugia_id`, `empleado_id`)  
**FK:** ON DELETE CASCADE en ambas columnas

---

### 3.16 `anestesia` — Protocolo Anestésico

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INT(11) | PK, AUTO_INCREMENT |
| `cirugia_id` | INT(11) | NOT NULL, FK → cirugia |
| `protocolo` | VARCHAR(200) | NULL |
| `farmacos` | TEXT | NULL |
| `dosis` | TEXT | NULL |
| `observaciones` | TEXT | NULL |

**FK:** `anestesia_ibfk_1` → `cirugia(id)` ON DELETE CASCADE

---

### 3.17 `vacuna` — Registro de Vacunación

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INT(11) | PK, AUTO_INCREMENT |
| `paciente_id` | INT(11) | NOT NULL, FK → paciente |
| `nombre` | VARCHAR(100) | NOT NULL |
| `fecha_aplicacion` | DATE | NOT NULL |
| `proxima_dosis` | DATE | NULL |
| `lote` | VARCHAR(50) | NULL |
| `fabricante` | VARCHAR(255) | NULL |
| `via_administracion` | VARCHAR(50) | NULL |
| `dosis` | VARCHAR(100) | NULL |
| `observaciones` | TEXT | NULL |

**FK:** `vacuna_ibfk_1` → `paciente(id)` ON DELETE CASCADE

---

### 3.18 `recibo` — Recibos de Pago

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | INT(11) | PK, AUTO_INCREMENT | |
| `clinica_id` | INT(11) | NOT NULL, FK → clinicas | |
| `paciente_id` | INT(11) | NOT NULL, FK → paciente | |
| `expediente_id` | INT(11) | NULL, FK → expediente | |
| `empleado_id` | INT(11) | NULL, FK → empleados | |
| `fecha` | DATE | NOT NULL | |
| `motivo_consulta` | TEXT | NULL | |
| `total` | DECIMAL(10,2) | NOT NULL, DEFAULT 0.00 | |
| `status` | ENUM('borrador','finalizado') | NOT NULL, DEFAULT 'borrador' | |
| `created_at` | TIMESTAMP | DEFAULT current_timestamp() | |

**Índices:** PK(`id`), KEY `idx_recibo_clinica`, `idx_recibo_paciente`, `idx_recibo_expediente`, `idx_recibo_empleado`, `idx_recibo_fecha`, `idx_recibo_status`

---

### 3.19 `recibo_item` — Ítems del Recibo

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INT(11) | PK, AUTO_INCREMENT |
| `recibo_id` | INT(11) | NOT NULL, FK → recibo |
| `servicio_id` | INT(11) | NULL, FK → servicio_catalogo |
| `nombre_servicio` | VARCHAR(200) | NOT NULL |
| `precio_unitario` | DECIMAL(10,2) | NOT NULL |
| `cantidad` | INT(11) | NOT NULL, DEFAULT 1 |
| `subtotal` | DECIMAL(10,2) | NOT NULL |
| `notas` | TEXT | NULL |

**FK:** ON DELETE CASCADE → recibo; ON DELETE SET NULL → servicio_catalogo

---

### 3.20 `servicio_catalogo` — Catálogo de Servicios

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INT(11) | PK, AUTO_INCREMENT |
| `clinica_id` | INT(11) | NOT NULL, FK → clinicas |
| `categoria` | VARCHAR(100) | NOT NULL (Consultas, Vacunas, Cirugía, etc.) |
| `nombre` | VARCHAR(200) | NOT NULL |
| `precio` | DECIMAL(10,2) | NOT NULL, DEFAULT 0.00 |
| `activo` | TINYINT(1) | NOT NULL, DEFAULT 1 |
| `created_at` | TIMESTAMP | |

**Índices:** KEY `idx_servcat_clinica`, `idx_servcat_categoria`, `idx_servcat_activo`

---

### 3.21 `inventario` — Inventario de Productos

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INT(11) | PK, AUTO_INCREMENT |
| `clinica_id` | INT(11) | NOT NULL, FK → clinicas |
| `nombre` | VARCHAR(155) | NOT NULL |
| `descripcion` | TEXT | NULL |
| `stock` | INT(11) | NOT NULL, DEFAULT 0 |
| `stock_minimo` | INT(11) | NOT NULL, DEFAULT 0 |
| `precio` | DECIMAL(10,2) | NOT NULL, DEFAULT 0.00 |
| `unidad` | VARCHAR(50) | DEFAULT 'unidades' |
| `creado_en` | TIMESTAMP | DEFAULT current_timestamp() |

---

### 3.22 `solicitud_reabastecimiento` — Solicitudes de Stock

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INT(11) | PK, AUTO_INCREMENT |
| `clinica_id` | INT(11) | NOT NULL, FK → clinicas |
| `empleado_id` | INT(11) | NOT NULL, FK → empleados |
| `producto_nombre` | VARCHAR(155) | NOT NULL |
| `cantidad` | INT(11) | NOT NULL, DEFAULT 1 |
| `notas` | TEXT | NULL |
| `status` | ENUM('pendiente','completado') | DEFAULT 'pendiente' |
| `creado_en` | TIMESTAMP | DEFAULT current_timestamp() |

---

### 3.23 `catalogo_medicamentos` — Catálogo Global de Medicamentos

Tabla **global** (sin `clinica_id`), usada por el módulo de Calculadoras Clínicas.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INT(11) | PK, AUTO_INCREMENT |
| `nombre` | VARCHAR(150) | NOT NULL |
| `categoria` | VARCHAR(100) | NOT NULL (AINE, Anestésico, Antibiótico, etc.) |
| `especie_destino` | ENUM('canino','felino','general') | NOT NULL |
| `dosis_mg_por_kg` | DECIMAL(10,4) | NULL |
| `dosis_min_mg_kg` | DECIMAL(10,4) | NULL |
| `dosis_max_mg_kg` | DECIMAL(10,4) | NULL |
| `concentracion_mg_ml` | DECIMAL(10,4) | NULL |
| `via_administracion` | VARCHAR(50) | NULL |
| `notas_clinicas` | TEXT | NULL |
| `created_at` | TIMESTAMP | |

**Índices:** KEY `idx_categoria`(`categoria`), KEY `idx_especie`(`especie_destino`)  
**Datos precargados:** 7 medicamentos (Meloxicam, Propofol, Amoxicilina-Clavulánico, Tramadol, Dexametasona, Ketamina, Furosemida)

---

### 3.24 `catalogo_toxicologia` — Catálogo Global de Toxinas

Tabla **global** (sin `clinica_id`), usada por la calculadora de Toxicología.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INT(11) | PK, AUTO_INCREMENT |
| `toxina` | VARCHAR(150) | NOT NULL |
| `especie_afectada` | ENUM('canino','felino','general') | NOT NULL |
| `dosis_toxica_leve_mg_kg` | DECIMAL(10,4) | NULL |
| `dosis_toxica_moderada_mg_kg` | DECIMAL(10,4) | NULL |
| `dosis_toxica_letal_mg_kg` | DECIMAL(10,4) | NULL |
| `mecanismo` | VARCHAR(255) | NULL |
| `signos_clinicos` | TEXT | NULL |
| `tratamiento_base` | TEXT | NULL |
| `notas` | TEXT | NULL |
| `created_at` | TIMESTAMP | |

**Índices:** KEY `idx_toxina`(`toxina`), KEY `idx_especie_tox`(`especie_afectada`)  
**Datos precargados:** 5 toxinas (Teobromina, Acetaminofén, Uvas/Pasas, Xilitol, Permetrina)

---

## 4. Relaciones y Foreign Keys — Resumen

| Tabla Hija | Columna FK | Tabla Padre | ON DELETE |
|------------|-----------|-------------|-----------|
| roles | clinica_id | clinicas | CASCADE |
| empleados | clinica_id | clinicas | CASCADE |
| empleados | rol_id | roles | RESTRICT |
| tutor | clinica_id | clinicas | SET NULL |
| paciente | clinica_id | clinicas | SET NULL |
| paciente | tutor_id | tutor | CASCADE |
| expediente | clinica_id | clinicas | SET NULL |
| expediente | paciente_id | paciente | CASCADE |
| consulta | expediente_id | expediente | CASCADE |
| consulta | empleado_id | empleados | SET NULL |
| diagnostico | consulta_id | consulta | CASCADE |
| tratamiento | consulta_id | consulta | CASCADE |
| hospitalizacion | expediente_id | expediente | CASCADE |
| hospitalizacion_empleados | hospitalizacion_id | hospitalizacion | CASCADE |
| hospitalizacion_empleados | empleado_id | empleados | CASCADE |
| seguimiento_hospitalizacion | hospitalizacion_id | hospitalizacion | CASCADE |
| alta | hospitalizacion_id | hospitalizacion | CASCADE |
| cirugia | expediente_id | expediente | CASCADE |
| cirugia_empleados | cirugia_id | cirugia | CASCADE |
| cirugia_empleados | empleado_id | empleados | CASCADE |
| anestesia | cirugia_id | cirugia | CASCADE |
| vacuna | paciente_id | paciente | CASCADE |
| recibo | clinica_id | clinicas | CASCADE |
| recibo | paciente_id | paciente | (sin acción) |
| recibo | expediente_id | expediente | SET NULL |
| recibo | empleado_id | empleados | SET NULL |
| recibo_item | recibo_id | recibo | CASCADE |
| recibo_item | servicio_id | servicio_catalogo | SET NULL |
| servicio_catalogo | clinica_id | clinicas | CASCADE |
| inventario | clinica_id | clinicas | CASCADE |
| solicitud_reabastecimiento | clinica_id | clinicas | CASCADE |
| roles | clinica_id | clinicas | CASCADE |

---

## 5. Normalización

El esquema alcanza **Tercera Forma Normal (3FN)**:

- **1FN:** Todos los atributos son atómicos. No hay grupos repetitivos.
- **2FN:** Todas las columnas no-clave dependen completamente de la clave primaria. Las tablas puente (`cirugia_empleados`, `hospitalizacion_empleados`) tienen PK compuesta correctamente definida.
- **3FN:** No existen dependencias transitivas. Los datos de clínica no se repiten en tablas hijas; se referencia mediante `clinica_id`.

**Decisiones de diseño:**
- `SET NULL` en lugar de `CASCADE` para `clinica_id` en `tutor`, `paciente` y `expediente` preserva el historial clínico si una clínica es eliminada.
- `SET NULL` en `consulta.empleado_id` y `recibo.empleado_id` preserva registros si un empleado es eliminado.
- Las tablas de catálogo (`catalogo_medicamentos`, `catalogo_toxicologia`) son globales (sin `clinica_id`) para compartir datos clínicos entre todos los tenants.

---

## 6. Índices Estratégicos

| Índice | Tabla | Columna(s) | Propósito |
|--------|-------|-----------|-----------|
| `idx_empleados_clinica` | empleados | clinica_id | Filtrado multi-tenant |
| `idx_empleados_rol` | empleados | rol_id | JOIN con roles |
| `idx_expediente_clinica` | expediente | clinica_id | Filtrado multi-tenant |
| `idx_paciente_clinica` | paciente | clinica_id | Filtrado multi-tenant |
| `idx_tutor_clinica` | tutor | clinica_id | Filtrado multi-tenant |
| `idx_roles_clinica` | roles | clinica_id | Filtrado multi-tenant |
| `idx_consulta_empleado` | consulta | empleado_id | Scorecard de empleados |
| `idx_recibo_clinica` | recibo | clinica_id | Filtrado multi-tenant |
| `idx_recibo_fecha` | recibo | fecha | KPI de ingresos por mes |
| `idx_recibo_status` | recibo | status | Filtro borrador/finalizado |
| `idx_servcat_categoria` | servicio_catalogo | categoria | Agrupación por categoría |
| `idx_servcat_activo` | servicio_catalogo | activo | Filtro de servicios activos |
| `idx_categoria` | catalogo_medicamentos | categoria | Búsqueda por categoría |
| `idx_especie` | catalogo_medicamentos | especie_destino | Filtro por especie |
| `idx_cirugia_emp_empleado` | cirugia_empleados | empleado_id | Scorecard de cirugías |
| `idx_hosp_emp_empleado` | hospitalizacion_empleados | empleado_id | Scorecard de hospitalizaciones |

---

## 7. Queries Principales del Sistema

### 7.1 Estadísticas Globales (GET /api/stats)
```sql
SELECT
  (SELECT COUNT(*) FROM tutor) AS tutores,
  (SELECT COUNT(*) FROM paciente) AS pacientes,
  (SELECT COUNT(*) FROM consulta) AS consultas,
  (SELECT COUNT(*) FROM hospitalizacion) AS hospitalizaciones,
  (SELECT COUNT(*) FROM cirugia) AS cirugias,
  (SELECT COUNT(*) FROM vacuna) AS vacunas
```

### 7.2 Dashboard Clínica — KPIs del Mes
```sql
-- Ingresos del mes
SELECT COALESCE(SUM(total), 0) AS ingresos_mes
FROM recibo
WHERE clinica_id = ? AND status = 'finalizado'
  AND YEAR(fecha) = YEAR(CURDATE()) AND MONTH(fecha) = MONTH(CURDATE())

-- Consultas de hoy
SELECT COUNT(*) AS consultas_hoy
FROM consulta c
JOIN expediente e ON c.expediente_id = e.id
WHERE e.clinica_id = ? AND c.fecha = CURDATE()
```

### 7.3 Scorecard de Empleados (Dashboard)
```sql
SELECT
  emp.id AS empleado_id,
  CONCAT(emp.nombre, ' ', emp.apellidos) AS empleado_nombre,
  r.nombre AS rol,
  COALESCE(cons.total_consultas, 0) AS total_consultas,
  COALESCE(cir.total_cirugias, 0) AS total_cirugias,
  COALESCE(hosp.total_hospitalizaciones, 0) AS total_hospitalizaciones,
  (COALESCE(cons.total_consultas, 0) + COALESCE(cir.total_cirugias, 0) + COALESCE(hosp.total_hospitalizaciones, 0)) AS total_actividad
FROM empleados emp
LEFT JOIN roles r ON emp.rol_id = r.id
LEFT JOIN (
  SELECT c.empleado_id, COUNT(*) AS total_consultas
  FROM consulta c JOIN expediente e ON c.expediente_id = e.id
  WHERE e.clinica_id = ? GROUP BY c.empleado_id
) cons ON emp.id = cons.empleado_id
-- ... (LEFT JOINs similares para cirugías y hospitalizaciones)
WHERE emp.clinica_id = ?
ORDER BY total_actividad DESC
```

### 7.4 Pacientes con Tutor (JOIN)
```sql
SELECT p.*, CONCAT(t.nombre, ' ', t.apellidos) AS tutor,
  TIMESTAMPDIFF(YEAR, p.fecha_nacimiento, CURDATE()) AS edad
FROM paciente p
LEFT JOIN tutor t ON p.tutor_id = t.id
WHERE p.clinica_id = ?
ORDER BY p.nombre
```

### 7.5 Notificaciones — Vacunas Próximas (7 días)
```sql
SELECT v.id, v.nombre AS vacuna_nombre, v.proxima_dosis AS fecha,
  p.nombre AS paciente_nombre, 'vacuna' AS tipo,
  CONCAT('Próxima dosis de ', v.nombre, ' para ', p.nombre) AS mensaje
FROM vacuna v
JOIN paciente p ON v.paciente_id = p.id
WHERE p.clinica_id = ?
  AND v.proxima_dosis BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
ORDER BY v.proxima_dosis ASC
```

### 7.6 Cirugías con Anestesia y Equipo (JOIN múltiple)
```sql
SELECT c.id, c.fecha, c.procedimiento,
  a.protocolo, a.farmacos, a.dosis,
  GROUP_CONCAT(DISTINCT CONCAT(emp.nombre, ' ', emp.apellidos) SEPARATOR ', ') AS empleados_nombres
FROM cirugia c
LEFT JOIN anestesia a ON c.id = a.cirugia_id
JOIN expediente e ON c.expediente_id = e.id
LEFT JOIN cirugia_empleados ce ON c.id = ce.cirugia_id
LEFT JOIN empleados emp ON ce.empleado_id = emp.id
WHERE e.clinica_id = ?
GROUP BY c.id, a.id
ORDER BY c.fecha DESC
```

### 7.7 Alertas de Inventario Bajo
```sql
SELECT id, nombre, stock
FROM inventario
WHERE clinica_id = ? AND stock <= 5
ORDER BY stock ASC
LIMIT 5
```

### 7.8 Reporte General Multi-tenant
```sql
SELECT
  (SELECT COUNT(*) FROM paciente WHERE clinica_id = ?) AS pacientes,
  (SELECT COUNT(*) FROM hospitalizacion h JOIN expediente e ON h.expediente_id = e.id WHERE e.clinica_id = ?) AS hospitalizaciones,
  (SELECT COUNT(*) FROM cirugia c JOIN expediente e ON c.expediente_id = e.id WHERE e.clinica_id = ?) AS cirugias,
  (SELECT COUNT(*) FROM consulta c JOIN expediente e ON c.expediente_id = e.id WHERE e.clinica_id = ?) AS consultas,
  (SELECT COUNT(*) FROM vacuna v JOIN paciente p ON v.paciente_id = p.id WHERE p.clinica_id = ?) AS vacunas,
  (SELECT COUNT(*) FROM tutor WHERE clinica_id = ?) AS tutores
```

---

## 8. Estrategia Multi-Tenant

El sistema implementa **Row-Level Multi-Tenancy**: cada fila de datos pertenece a un tenant identificado por `clinica_id`. El aislamiento se garantiza en dos niveles:

1. **Nivel de aplicación:** El `authMiddleware` extrae `clinica_id` del JWT y lo inyecta en `req.user`. Todas las queries incluyen `WHERE clinica_id = req.user.clinica_id`.
2. **Nivel de base de datos:** Las FK con `ON DELETE CASCADE` garantizan que al eliminar una clínica, todos sus datos se eliminan en cascada.

**Verificación de pertenencia:** Antes de insertar registros relacionados (consultas, hospitalizaciones, cirugías), el backend verifica que el expediente padre pertenezca a la clínica autenticada:
```sql
SELECT id FROM expediente WHERE id = ? AND clinica_id = ?
```

---

*Documentación generada automáticamente a partir del código fuente del proyecto ANA-VET · Mayo 2026*
