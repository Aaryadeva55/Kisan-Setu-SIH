FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and package manifests
COPY package.json package-lock.json ./
COPY packages/types/package.json ./packages/types/
COPY packages/config/package.json ./packages/config/
COPY packages/shared/package.json ./packages/shared/
COPY apps/worker/package.json ./apps/worker/
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source files
COPY packages ./packages
COPY apps/worker ./apps/worker

# Generate Prisma client and build packages
RUN npx prisma generate
RUN npm run build --workspace @kisan-setu/types
RUN npm run build --workspace @kisan-setu/config
RUN npm run build --workspace @kisan-setu/shared
RUN npm run build --workspace @kisan-setu/worker

# Production Runner
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/apps/worker/package.json ./apps/worker/
COPY --from=builder /app/prisma ./prisma

CMD ["node", "apps/worker/dist/index.js"]
