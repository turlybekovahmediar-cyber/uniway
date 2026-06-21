-- Migration 0001 — Freemium / UniWay Pro
-- Запуск (production):  npx wrangler d1 execute uniway_db --remote --file=./migrations/0001_premium.sql
-- Запуск (локально):    npx wrangler d1 execute uniway_db --local  --file=./migrations/0001_premium.sql
--
-- D1/SQLite не поддерживает "ADD COLUMN IF NOT EXISTS", поэтому при повторном
-- запуске ALTER на уже существующую колонку выдаст ошибку "duplicate column" —
-- это безопасно проигнорировать.

-- 1. Премиум-флаг и дата активации Pro у пользователя
ALTER TABLE users ADD COLUMN isPremium INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN premiumSince TEXT;

-- 2. Лог транзакций (PayPal)
CREATE TABLE IF NOT EXISTS payments (
  id         TEXT PRIMARY KEY,
  userId     TEXT NOT NULL,
  orderId    TEXT NOT NULL,
  amount     REAL NOT NULL,
  currency   TEXT NOT NULL DEFAULT 'USD',
  status     TEXT NOT NULL,
  provider   TEXT NOT NULL DEFAULT 'paypal',
  createdAt  TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Уникальность orderId защищает от двойного зачисления (идемпотентность capture)
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_orderId ON payments(orderId);
CREATE INDEX IF NOT EXISTS idx_payments_userId ON payments(userId);
