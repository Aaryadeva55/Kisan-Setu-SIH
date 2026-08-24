FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and package manifests
COPY package.json package-lock.json ./
COPY packages/types/package.json ./packages/types/
COPY packages/config/package.json ./packages/config/
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source files
COPY packages ./packages
COPY apps/api ./apps/api

# Generate Prisma client and build packages
RUN npx prisma generate
RUN npm run build --workspace @kisan-setu/types
RUN npm run build --workspace @kisan-setu/config
RUN npm run build --workspace @kisan-setu/shared
RUN npm run build --workspace @kisan-setu/api

# Production Runner
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/src/locales ./apps/api/dist/locales
COPY --from=builder /app/prisma ./prisma

EXPOSE 4000

CMD ["node", "apps/api/dist/index.js"]
