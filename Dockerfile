# ─────────────────────────────────────────────────────────────────────────────
# Nexus frontend — imagen de producción (Next.js standalone)
#
#   docker build -t nexus-frontend .
#   docker run -p 127.0.0.1:3000:3000 nexus-frontend
#
# Las variables NEXT_PUBLIC_* se incrustan en el bundle al compilar. Con la API
# same-origin (/api/v1) el mismo artefacto sirve a todos los subdominios y
# custom domains: Nginx envía /api/ y /socket.io/ al backend.
# ─────────────────────────────────────────────────────────────────────────────

FROM node:20-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ── Dependencias ──────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ── Compilación ───────────────────────────────────────────────────────────────
FROM base AS build
ARG NEXT_PUBLIC_API_URL=/api/v1
ARG NEXT_PUBLIC_SA_TENANT_SLUG=super-admin
# Opcional: si la integración Lector App se publica en otro host (api.<dominio>)
ARG NEXT_PUBLIC_INTEGRATIONS_URL=
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_SA_TENANT_SLUG=${NEXT_PUBLIC_SA_TENANT_SLUG}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN if [ -n "$NEXT_PUBLIC_INTEGRATIONS_URL" ]; then export NEXT_PUBLIC_INTEGRATIONS_URL; else unset NEXT_PUBLIC_INTEGRATIONS_URL; fi \
 && npm run build

# ── Runtime ───────────────────────────────────────────────────────────────────
FROM base AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -S nextjs && adduser -S -G nextjs nextjs && apk add --no-cache tini
# server.js mínimo + dependencias trazadas; los estáticos se copian aparte.
COPY --from=build --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nextjs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nextjs /app/public ./public
USER nextjs

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
