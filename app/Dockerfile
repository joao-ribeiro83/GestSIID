# syntax=docker/dockerfile:1
# One image, one container per environment (ARCHITECTURE.md §2, D-02).

# ---- Build stage ----
FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@12.4.2 --activate

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm -r build
RUN pnpm --filter @gestsiid/api deploy --prod /out

# ---- Runtime stage ----
FROM node:22-bookworm-slim AS runtime

RUN apt-get update \
  && apt-get install -y --no-install-recommends libaio1 unzip curl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Oracle Instant Client 19.32 Basic (not Basic Light: the DB charset is WE8ISO8859P15, A-03).
# Pinned to 19, not 23: Instant Client 23 only connects to Database 19c or later, and this
# DB is 12.2.0.1.0 (analysis/db/DB_FACTS.md) — 19 supports 11.2 or later, so it's the floor
# that still covers this DB. URL/sha256 verified against Oracle's download page 2026-09-22.
ARG INSTANT_CLIENT_URL=https://download.oracle.com/otn_software/linux/instantclient/1932000/instantclient-basic-linux.x64-19.32.0.0.0dbru.zip
ARG INSTANT_CLIENT_SHA256=1749ca1eb5f75b038f2b7ce0abc42eb4575928159259fc4fc851c54a8ca7b002
RUN curl -fsSL "$INSTANT_CLIENT_URL" -o /tmp/instantclient.zip \
  && echo "$INSTANT_CLIENT_SHA256  /tmp/instantclient.zip" | sha256sum -c - \
  && unzip -q /tmp/instantclient.zip -d /opt/oracle \
  && rm /tmp/instantclient.zip \
  && echo /opt/oracle/instantclient* > /etc/ld.so.conf.d/oracle-instantclient.conf \
  && ldconfig

ENV UV_THREADPOOL_SIZE=8
ENV NODE_ENV=production

WORKDIR /app
# pnpm deploy flattens the deployed package to the target root (/out/dist/server.js, not
# /out/apps/api/dist/server.js) — copy it back under apps/api so it lands next to
# apps/web/dist, matching the ../../web/dist path server.ts computes from its own location.
COPY --from=build --chown=node:node /out ./apps/api
COPY --from=build --chown=node:node /app/apps/web/dist ./apps/web/dist

USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+(process.env.BASE_PATH||'')+'/api/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"

CMD ["node", "apps/api/dist/server.js"]
