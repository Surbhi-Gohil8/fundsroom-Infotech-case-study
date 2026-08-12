# -------------------------
# Build stage
# -------------------------
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

# Install all dependencies because Prisma CLI and TypeScript
# are required during the build.
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./

# Generate Prisma Client
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build


# -------------------------
# Production stage
# -------------------------
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

# Install production dependencies only.
RUN npm ci --omit=dev --ignore-scripts

# Copy generated Prisma client and application build
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

EXPOSE 5000

CMD ["node", "dist/server.js"]