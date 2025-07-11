# Dockerfile

# 1. Installer Stage: Install dependencies
FROM node:20-alpine AS installer
WORKDIR /app

# Copy package.json and lock files
COPY package.json ./
COPY yarn.lock ./
COPY pnpm-lock.yaml ./
COPY package-lock.json ./

# Install dependencies based on which lock file is present
RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    else echo "Lockfile not found." && exit 1; \
    fi

# 2. Builder Stage: Build the Next.js application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=installer /app/ .
COPY . .

RUN npm run build

# 3. Runner Stage: Create the final, small image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line in case of trouble running the compiled application
# ENV NEXT_TELEMETRY_DISABLED 1

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy the data directory
COPY --from=builder /app/data ./data

# The port should be 3000, not 9002 in production
EXPOSE 3000
ENV PORT=3000

# Next.js runs on localhost:3000 by default
# Run the application
CMD ["node", "server.js"]
