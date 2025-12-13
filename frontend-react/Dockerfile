# syntax=docker/dockerfile:1
# =============================================================================
# Dockerfile OPTIMIZADO para Next.js con cache de npm
# Usa BuildKit para máxima eficiencia
# =============================================================================

FROM node:20-alpine AS builder
WORKDIR /app

# Instalar dependencias de sistema si son necesarias
RUN apk add --no-cache libc6-compat

# Copiar archivos de dependencias primero (mejor cache)
COPY package.json package-lock.json* ./

# Instalar dependencias con cache mount (BuildKit)
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps

# Copiar archivos de configuración necesarios para el build
COPY next.config.js ./
COPY tsconfig.json ./
COPY postcss.config.mjs ./
COPY components.json ./

# Copiar código fuente
COPY public ./public
COPY src ./src

# Copiar worker de PDF.js
RUN cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.mjs

# Variables para build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build de producción
RUN npm run build

# =============================================================================
# Stage 2: Runner - Imagen de producción minimal
# =============================================================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar solo los archivos necesarios del build standalone
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Healthcheck integrado
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget -q --spider http://localhost:3000 || exit 1

CMD ["node", "server.js"]