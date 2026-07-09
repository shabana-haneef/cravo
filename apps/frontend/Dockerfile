# Stage 1: Build
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files to leverage Docker layer caching
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the React application via Vite for production
# This generates optimized, hashed static assets in the /app/dist folder
RUN npm run build

# Stage 2: Production Nginx Server
FROM nginx:alpine AS production

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy the custom Nginx configuration with compression and security headers
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built React app from the builder stage to Nginx's serving directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Change ownership to the unprivileged nginx user
RUN chown -R nginx:nginx /usr/share/nginx/html /etc/nginx/conf.d && \
    chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Run Nginx as a non-root user for enhanced security
USER nginx

# Expose port 8080
EXPOSE 8080

# Container Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
