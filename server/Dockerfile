FROM node:20-alpine AS base

WORKDIR /app

# Copy shared package first (from repo root context)
# Build context must be set to repo root, not server/
COPY shared/ ./shared/

# Copy server package files for dependency install
COPY server/package.json server/package-lock.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy server source
COPY server/ ./

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache curl

COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/shared ./shared

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

CMD ["node", "dist/server/src/index.js"]
