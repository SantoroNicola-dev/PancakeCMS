FROM node:22-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm install --foreground-scripts

FROM base AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p /app/public/uploads
# Dummy DATABASE_URL per consentire il completamento di `next build` su Coolify
# anche quando il DB reale viene iniettato solo a runtime
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Installiamo curl, wget e anche postgresql + su-exec:
# - se in Coolify imposti DATABASE_URL (o usi Docker Compose), usa il DB esterno;
# - se invece avvii il singolo Dockerfile senza DATABASE_URL, avvia automaticamente PostgreSQL integrato!
RUN apk add --no-cache libc6-compat openssl wget curl postgresql postgresql-contrib su-exec && \
  mkdir -p /app/public/uploads /run/postgresql && \
  chown -R postgres:postgres /run/postgresql

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/lib ./src/lib
COPY --from=builder /app/scripts ./scripts

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=5 \
  CMD curl -fsS http://127.0.0.1:3000/api/health || wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "scripts/docker-boot.mjs"]
