# Dockerfile for AICache Next.js Application

# Stage 1: Dependency Installation
# This stage installs dependencies and caches them.
FROM node:20-slim AS deps
WORKDIR /app

# Copy package.json and lock file
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install --frozen-lockfile

# Stage 2: Builder
# This stage builds the Next.js application.
FROM node:20-slim AS builder
WORKDIR /app

# Copy dependencies from the 'deps' stage
COPY --from=deps /app/node_modules ./node_modules
# Copy all other source code
COPY . .

# Environment variables for the build
ENV NEXT_TELEMETRY_DISABLED 1

# Run the build command
RUN npm run build

# Stage 3: Runner
# This is the final, optimized production image.
FROM node:20-slim AS runner
WORKDIR /app

# Set the environment to production
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user for better security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only necessary files from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/data ./data

# Switch to the non-root user
USER nextjs

# Expose the port the app runs on
EXPOSE 3000

# Set the host to listen on all interfaces
ENV HOSTNAME 0.0.0.0

# The command to start the app
# The 'server.js' file is created by Next.js in the standalone output.
CMD ["node", "server.js"]
