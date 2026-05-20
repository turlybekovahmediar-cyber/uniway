FROM node:20-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

#Запуск в продакшене
FROM node:20-slim AS runner
WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/public ./public

EXPOSE 3000

# Команда для запуска локального сервера Hono
CMD ["npm", "run", "dev", "--", "--port", "3000", "--host", "0.0.0.0"]