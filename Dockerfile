
# 1. Official Node.js 20 Alpine image
FROM node:20-alpine AS base

# 2. Set working directory
WORKDIR /app

# 3. Install pnpm
RUN npm install -g pnpm


# 4. Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --prod=false


# 5. Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build


# 6. Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from the builder stage
COPY --from=builder /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/data ./data

# Set the user
USER nextjs

# Expose the port
EXPOSE 9002

# Set the entrypoint
ENTRYPOINT [ "node", ".next/standalone/server.js" ]
