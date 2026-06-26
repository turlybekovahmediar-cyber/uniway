-- Migration 0002 — Rate limiting
-- Запуск (production):  npx wrangler d1 execute uniway_db --remote --file=./migrations/0002_rate_limits.sql
--
-- Хранит счётчики попыток по ключу "<action>:<ip>" с фиксированным окном.
-- Бэкенд fail-open: пока таблицы нет, лимитер просто пропускает запросы.

CREATE TABLE IF NOT EXISTS rate_limits (
  id          TEXT PRIMARY KEY,        -- "<action>:<ip>", напр. "login:1.2.3.4"
  count       INTEGER NOT NULL DEFAULT 0,
  windowStart INTEGER NOT NULL         -- Unix ms начала текущего окна
);
