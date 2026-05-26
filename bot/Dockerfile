FROM node:24-alpine

WORKDIR /app

# Зависимости бота
COPY bot/package*.json ./
RUN npm ci --omit=dev

# Берём ОБЩУЮ схему из backend, чтобы Prisma Client совпадал по версии
COPY backend/prisma ./prisma
RUN npx prisma generate

# Код бота
COPY bot/ .

CMD ["node", "index.js"]