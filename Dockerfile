# 1. Base layer
FROM node:20-alpine AS base
WORKDIR /app

# 2. Dependencies layer
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# 3. Builder layer
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 4. Runner layer
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=9002

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 9002

# This command ensures that the mounted volume directory has the correct permissions
# before starting the server. It then uses the correct command for a standalone build.
CMD sh -c 'sudo chown -R nextjs:nodejs /app/data && node .next/standalone/server.js'
