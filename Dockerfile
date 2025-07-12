# 1. Base image for all stages
FROM node:20-alpine AS base
WORKDIR /app

# 2. Dependencies layer
FROM base AS deps
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
# Use the recommended KEY=VALUE format
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create the /app/data directory and set its ownership to the 'nextjs' user
# This is the crucial fix for the EACCES permission denied error.
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

# Use the recommended KEY=VALUE format
ENV PORT=3000

CMD ["npm", "start"]
