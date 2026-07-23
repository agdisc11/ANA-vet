# 🐾 ANA-vet — Sistema de Gestión Veterinaria

SaaS **multi-tenant** para clínicas veterinarias: gestión de tutores, pacientes,
expedientes, consultas, hospitalizaciones, cirugías, vacunas, inventario,
recibos, reportes en PDF y un módulo avanzado de **calculadoras clínicas**.

Cada clínica (tenant) opera con sus propios datos, aislados por `clinica_id`, y
con control de acceso por rol (Administrador / Veterinario / Recepcionista).

---

## 🧱 Arquitectura

```
ANA-vet/
├── backend/clinica-vet-backend     → API REST (Node + Express 5 + MySQL)
│   ├── index.js                    → bootstrap, CORS, rutas, health, errores
│   └── src/
│       ├── routes/                 → endpoints por dominio
│       ├── controllers/            → lógica de negocio
│       ├── middleware/             → auth JWT + manejo global de errores
│       └── db/                     → conexión y migraciones
├── frontend/clinica-vet-frontend   → SPA (React 19 + Tailwind + React Router 7)
│   └── src/
│       ├── pages/                  → vistas por módulo
│       ├── components/             → UI reutilizable (Sidebar, Loaders, Toast…)
│       ├── context/                → Auth, Toast, Confirm
│       └── api.js                  → cliente axios + interceptor 401
└── Base de datos/                  → scripts SQL
```

### Stack

| Capa      | Tecnología                                                        |
|-----------|-------------------------------------------------------------------|
| Frontend  | React 19, React Router 7, Tailwind CSS 3, Axios, jsPDF            |
| Backend   | Node.js, Express 5, MySQL2, JWT, bcryptjs, PDFKit                 |
| Auth      | JWT (Bearer) + bcrypt, multi-tenant por `clinica_id`             |

---

## 🚀 Puesta en marcha

### Requisitos
- Node.js 18+
- MySQL 8+ con la base `clinica_veterinaria` creada (ver `Base de datos/`)

### Backend

```bash
cd backend/clinica-vet-backend
npm install
# crea un archivo .env (ver variables abajo)
npm run dev          # nodemon en http://localhost:4000
```

Variables de entorno (`backend/clinica-vet-backend/.env`):

```env
PORT=4000
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=clinica_veterinaria
JWT_SECRET=<cadena-secreta-larga-y-aleatoria>
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

> `JWT_SECRET` es **obligatorio**: el servidor no arranca sin él.

### Frontend

```bash
cd frontend/clinica-vet-frontend
npm install
npm start            # http://localhost:3000
```

Opcional — apuntar a otra API (`frontend/clinica-vet-frontend/.env`):

```env
REACT_APP_API_URL=http://localhost:4000/api
```

---

## 🔌 Endpoints clave

| Método | Ruta                       | Descripción                          |
|--------|----------------------------|--------------------------------------|
| GET    | `/api/health`              | Health check (uptime / timestamp)    |
| POST   | `/api/clinicas/login`      | Login de administrador de clínica    |
| POST   | `/api/empleados/login`     | Login de empleado                    |
| CRUD   | `/api/tutores`             | Tutores (propietarios)               |
| CRUD   | `/api/pacientes`           | Pacientes (animales)                 |
| GET    | `/api/dashboard/clinica`   | Métricas de la torre de control      |
| GET    | `/api/reports/:tipo`       | Reportes en PDF                      |

Todas las rutas (excepto login/registro/health) requieren el header
`Authorization: Bearer <token>`.

---

## ✨ Convenciones de UX (frontend)

- **Notificaciones:** usa `useToast()` (`success` / `error` / `warning` / `info`)
  en lugar de `alert()`.
- **Confirmaciones:** usa `useConfirm()` (promesa) en lugar de `window.confirm()`.
- **Cargando:** componentes en `components/Loaders.js`
  (`Spinner`, `PageLoader`, `Skeleton`, `TableSkeleton`, `EmptyState`).
- **Sesión expirada:** el interceptor de `api.js` cierra sesión automáticamente
  ante un `401` y notifica al usuario.
- **Estilos:** clases utilitarias en `index.css` (`.btn-primary`, `.card`,
  `.input`, `.badge-*`, etc.). Soporta modo claro/oscuro.
