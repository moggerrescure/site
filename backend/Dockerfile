# Используем slim (Debian) вместо alpine — sharp 0.33 ставится из prebuilt без vips-dev
FROM node:24-slim AS base

# OpenSSL нужен для Prisma на debian-slim (с Prisma 6.x обязательно)
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# === Deps ===
COPY package*.json ./
RUN npm ci --omit=dev

# === Prisma generate (отдельный слой — кешируется при изменении только кода) ===
COPY prisma ./prisma
RUN npx prisma generate

# === App code ===
COPY . .

# Папка для multer.tmp + конечный volume mount
RUN mkdir -p uploads

ENV NODE_ENV=production
EXPOSE 3000

# Миграции на старте, потом сервер
CMD ["sh", "-c", "npx prisma migrate deploy && node index.js"]