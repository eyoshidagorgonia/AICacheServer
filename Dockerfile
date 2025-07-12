# 1. Official Node.js 20 Alpine image as a base
FROM node:20-alpine AS base
WORKDIR /app

# 2. Dependencies layer
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# 3. Builder layer
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 4. Runner layer
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 9002

ENV PORT 9002

CMD ["node", "server.js"]
