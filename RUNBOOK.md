# UniWay — Runbook инцидентов (OPS-007)

Стек: **Cloudflare Pages + Workers (Hono) + D1**. Деплой — через GitHub Actions
(`main` → CI → `wrangler pages deploy --branch=production`). Прод: https://webapp-f21.pages.dev

Пиши план ДО инцидента. В 2:00 ночи ты не будешь соображать ясно.

---

## Быстрая диагностика (всегда начинай отсюда)

```bash
# 1. Жив ли сервис и БД?
curl -s https://webapp-f21.pages.dev/api/health
# Ожидаемо: {"status":"ok","db":"ok",...}
# db:"error" → проблема с D1 (см. Сценарий 3)

# 2. Логи в реальном времени (структурированный JSON)
npx wrangler pages deployment tail --project-name=webapp
# Фильтровать события: login_failed, rate_limited, payment_failed, error
```

Где смотреть метрики: **Cloudflare Dashboard → Workers & Pages → webapp → Metrics**
(requests, errors, p50/p95/p99, CPU time) и **→ Logs** (real-time).

---

## 🔴 Сценарий 1: Сайт не открывается / 5xx

1. Проверь health (выше). Если `502/503` от Cloudflare — смотри **Dashboard → Deployments**: не упал ли последний деплой.
2. Открой **Deployments** — последний production-деплой зелёный? Если последний деплой сломал прод:
   ```
   Dashboard → webapp → Deployments → выбери предыдущий рабочий → Rollback to this deployment
   ```
   (или передеплой предыдущий хороший коммит).
3. Проверь логи (`wrangler ... tail`) на всплеск события `error` — там `path` и `message`.
4. Глобальный обработчик ошибок уже возвращает generic 500 и логирует JSON, стектрейсы наружу не утекают.

## 🟡 Сценарий 2: Платежи не проходят (PayPal)

1. `wrangler ... tail` → ищи `payment_failed` (поле `reason`: `not_completed` / `paypal_error` / `amount_mismatch`).
2. Проверь секрет: **Dashboard → webapp → Settings → Environment variables** — есть ли `PAYPAL_CLIENT_SECRET` (если нет → `getPayPalAccessToken` вернёт null → 503).
3. Проверь, что `PAYPAL_CLIENT_ID` (wrangler.jsonc) и секрет — из ОДНОГО приложения PayPal, и `PAYPAL_MODE` совпадает (sandbox/live).
4. Идемпотентность: повторный capture одного `orderId` не зачислит Pro дважды (уникальный индекс `idx_payments_orderId`).
5. Сверка с PayPal: developer.paypal.com → Sandbox → Dashboard → транзакции.

## 🔴 Сценарий 3: Ошибки базы данных (D1)

1. `/api/health` показывает `db:"error"`.
2. Проверь, применены ли миграции:
   ```bash
   npx wrangler d1 execute uniway_db --remote \
     --command "SELECT name FROM sqlite_master WHERE type='table'"
   ```
   Должны быть: `users, sessions, submissions, interview_results, payments, rate_limits`.
3. Не применённая миграция → прогнать `migrations/0001_premium.sql`, `0002_rate_limits.sql`.
4. Cloudflare D1 status: https://www.cloudflarestatus.com

## 🟡 Сценарий 4: Подозрительная активность / брутфорс

1. `wrangler ... tail` → всплеск `login_failed` или `rate_limited` с одного `ip`.
2. Rate limit уже режет: 5 логинов/мин и 3 регистрации/час на IP (таблица `rate_limits`).
3. При необходимости — Cloudflare **Security → WAF** → заблокировать IP/добавить правило.

---

## Откат деплоя (самое важное действие)

```
Dashboard → Workers & Pages → webapp → Deployments
→ найди последний РАБОЧИЙ деплой → "..." → Rollback to this deployment
```
Откат мгновенный (Cloudflare просто переключает production-алиас).

## Мониторинг и алерты (настроить заранее)

- **Метрики**: Dashboard → webapp → Metrics (встроенные, бесплатно).
- **Алерты**: Dashboard → Notifications → Add → "Pages deployment failed" + (через Health Checks / Workers) на доступность.
- **Бизнес-метрики**: админ-панель `/admin` → секция «Бизнес-метрики» (конверсия/выручка/ARPU) + PostHog (когда задан `POSTHOG_KEY`).
