# Nexus Frontend

Dashboard web multi-tenant para la plataforma Nexus. Construido con Next.js 15 App Router.

> Para el setup completo ver el [README raíz](../README.md).

## Stack

- **Next.js 15** — App Router, React Server Components
- **Tailwind CSS** — estilos
- **TanStack Query** — fetching y caché de datos
- **Zustand** — estado global (auth)
- **Recharts** — gráficos del dashboard
- **React Hook Form + Zod** — formularios y validación

## Variables de entorno

| Variable                    | Descripción                              | Ejemplo                          |
|-----------------------------|------------------------------------------|----------------------------------|
| `NEXT_PUBLIC_API_URL`       | URL base del backend                     | `http://localhost:4000/api/v1`   |
| `NEXT_PUBLIC_SA_TENANT_SLUG`| Slug del tenant super admin              | `super-admin`                    |

## Estructura de páginas

```
src/app/
├── (auth)/                     Páginas públicas
│   └── login/                  Login de tenant
├── (dashboard)/                Dashboard (requiere auth de tenant)
│   └── dashboard/
│       ├── page.tsx            Dashboard principal — KPIs + 5 módulos
│       ├── clients/            Clientes (listado, detalle, importación CSV)
│       ├── readings/           Lotes de lectura y generación de facturas
│       ├── billing/            Facturas emitidas
│       ├── payments/           Cobros registrados
│       ├── financing/          Planes de financiación
│       ├── reports/            Reportes exportables (XLSX)
│       ├── catalogs/           Catálogos (estratos, barrios, tarifas…)
│       ├── users/              Usuarios y roles del tenant
│       └── settings/
│           ├── billing/        Configuración de facturación
│           ├── invoice-template/ Plantilla visual de facturas (live preview)
│           └── api-keys/       API keys del tenant
└── (super-admin)/              Panel super admin (tenant independiente)
    └── super-admin/
        ├── login/
        └── tenants/            CRUD de tenants
```

## Comandos

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev        # http://localhost:3000

# Build
npm run build
npm start

# Lint
npm run lint
```

## Autenticación

El frontend mantiene dos stores Zustand independientes con `persist` en `localStorage`:

- `auth.store.ts` — sesión del usuario de tenant (`/dashboard/*`)
- `super-admin-auth.store.ts` — sesión del super admin (`/super-admin/*`)

El token de acceso expira en 15 minutos. El cliente Axios (`src/lib/api.ts`) intercepta los 401 y rota automáticamente el refresh token sin cerrar sesión.
