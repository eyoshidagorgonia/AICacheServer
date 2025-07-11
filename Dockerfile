# ---- Base ----
FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

# ---- Dependencies ----
FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --prod=false

# ---- Builder ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# ---- Runner ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Next.js standalone app runs on port 3000 by default.
ENV PORT=3000
# UID/GID for the node user.
ENV UID=1001
ENV GID=1001

# Don't run production as root
RUN addgroup --system --gid "$GID" nodejs
RUN adduser --system --uid "$UID" nextjs
USER nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

EXPOSE 3000

# The standalone server is located at server.js within the standalone output
CMD ["node", "server.js"]
