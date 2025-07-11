# 1. Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

# 2. Build the application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 3. Final production image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy the standalone output
COPY --from=builder /app/.next/standalone ./
# Copy the public and data directories
COPY --from=builder /app/public ./public
COPY --from=builder /app/data ./data

EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
