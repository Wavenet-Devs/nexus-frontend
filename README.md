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
| `NEXT_PUBLIC_DEV_TENANT_SLUG`| Solo desarrollo: empresa a usar en `localhost` (si falta, el login pide el slug) | — |
| `NEXT_PUBLIC_SOCKET_URL`    | Servidor Socket.IO si no se deriva de la API (vacío = mismo hostname) | — |
| `NEXT_PUBLIC_INTEGRATIONS_URL` | URL de la integración Lector App que se muestra en API keys | `<API sin /api/v1>/integrations/lector-app/v1` |

Las `NEXT_PUBLIC_*` se incrustan en el bundle **al compilar** (`next build`), no
se leen en runtime.

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

### Empresa por hostname

El usuario no escribe el slug: `spone.nexus-esp.com` (o un custom domain
registrado en el backend) identifica la empresa. Al cargar, `src/lib/tenant.ts`
consulta `GET /public/tenant/resolve?host=<hostname>` y el login muestra el
logo, nombre y color primario de la empresa, pidiendo solo correo y contraseña.

| Situación | Pantalla |
|---|---|
| Hostname de un tenant activo | Login con su marca |
| Hostname sin tenant | «Empresa no configurada» |
| Tenant inactivo | «Empresa inactiva» |
| `localhost` / IP | `NEXT_PUBLIC_DEV_TENANT_SLUG`, o un campo de slug marcado «solo desarrollo» |

El mismo build sirve para todos los tenants.

El token de acceso expira en 15 minutos. El cliente Axios (`src/lib/api.ts`) intercepta los 401 y rota automáticamente el refresh token sin cerrar sesión.

## Producción

Imagen multi-stage con `output: 'standalone'` (`Dockerfile`): `npm ci`,
`next build` y un runtime con solo `server.js`, los estáticos y las
dependencias trazadas, como usuario sin privilegios.

```bash
docker build -t nexus-frontend:<sha> \
  --build-arg NEXT_PUBLIC_API_URL=/api/v1 \
  --build-arg NEXT_PUBLIC_INTEGRATIONS_URL=https://api.nexus-esp.com/integrations/lector-app/v1 .
docker run -d -p 127.0.0.1:3000:3000 nexus-frontend:<sha>
```

Con `NEXT_PUBLIC_API_URL=/api/v1` (valor por defecto del Dockerfile) el
**mismo artefacto sirve a todos los tenants**: `spone.nexus-esp.com`,
`empresa3.nexus-esp.com` y los custom domains. No hace falta una URL de API
por tenant ni CORS.

Nginx, por hostname de tenant:

| Ruta | Destino |
|---|---|
| `/api/` | backend `127.0.0.1:4000` (`proxy_set_header Host $host`) |
| `/socket.io/` | backend `127.0.0.1:4000` con `Upgrade`/`Connection` para WebSocket |
| `/` | frontend `127.0.0.1:3000` |

El tenant sale del hostname que Nginx reenvía en `Host`. Recargar cualquier
ruta del App Router funciona: Next resuelve todas las rutas en `server.js`.

Health check del contenedor: `GET /healthz` (fuera de `/api`, que va al
backend). La imagen trae `HEALTHCHECK` contra esa ruta.

Variables de runtime: `PORT` (3000) y `HOSTNAME` (`0.0.0.0`). Todo lo demás se
fija al compilar.
