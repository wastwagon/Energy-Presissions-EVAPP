# Backend Dockerfile (Node.js)
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY backend/package*.json ./

# Install ALL dependencies (including dev for build)
RUN npm ci

# Copy application code
COPY backend/ ./

# Copy database folder from root
COPY database/ ./database/

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies for native modules and postgresql client for migrations
RUN apk add --no-cache python3 make g++ postgresql-client

# Copy package files
COPY backend/package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy database migration files from builder stage (where we copied everything)
COPY --from=builder /app/database/ ./database/
RUN chmod +x database/run-migrations.sh || true

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy entrypoint for migrations + startup (from builder)
COPY --from=builder /app/entrypoint.sh ./
RUN chmod +x entrypoint.sh

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose ports
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD node -e "const p=process.env.PORT||3000;require('http').get('http://127.0.0.1:'+p+'/health',(r)=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1));" || exit 1

# Run migrations then start application
ENTRYPOINT ["/app/entrypoint.sh"]



