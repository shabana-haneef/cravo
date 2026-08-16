# Stage 1: Build & Dependencies
FROM node:20-alpine AS builder

# Install build dependencies for native node modules (e.g., bcrypt)
RUN apk add --no-cache python3 make g++ 

WORKDIR /app

# Copy package files strictly to leverage Docker layer caching
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies needed for Prisma generation)
RUN npm ci

# Copy application source and Prisma schema
COPY src/ ./src/
COPY prisma/ ./prisma/

# Generate Prisma Client
RUN npx prisma generate

# Remove development dependencies to reduce image size
RUN npm prune --omit=dev

# Stage 2: Production Execution
FROM node:20-alpine AS production

# Set Node environment to production
ENV NODE_ENV=production
ENV PORT=5000

WORKDIR /app

# Create a non-root user and group for security
RUN addgroup -g 1001 nodejs && \
    adduser -u 1001 -G nodejs -s /bin/sh -D nodejs

# Change ownership of the application directory to the non-root user
RUN chown -R nodejs:nodejs /app

# Switch to the non-root user
USER nodejs

# Copy only the necessary runtime files from the builder stage
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/src ./src
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

# Expose the application port
EXPOSE 5000

# Container Healthcheck (depends on wget which is available in alpine)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

# Start the application natively (deploying migrations first)
# Note: we use exec to pass signals properly for graceful shutdown
CMD ["sh", "-c", "npx prisma migrate deploy && exec node src/server.js"]
