# UniWay — Чеклист готовности к продакшену (OPS-008)

Адаптировано под стек **Cloudflare Pages/Workers + D1** (slides рассчитаны на VPS+Docker).
Статус на 2026-06-28. ✅ готово · ⚠️ частично · ➖ не применимо к стеку.

## Инфраструктура
- ✅ Домен + HTTPS (зелёный замок) — `webapp-f21.pages.dev`, авто-TLS Cloudflare
- ✅ CI/CD деплой на push в `main` — GitHub Actions → `wrangler pages deploy --branch=production`
- ➖ Docker `restart: unless-stopped` — Workers перезапускаются/масштабируются автоматически (serverless)
- ✅ Бэкап БД — `backup.yml` (D1 экспорт по расписанию)

## Безопасность
- ✅ Секреты НЕ в git — `.env` в `.gitignore`, история чистая (проверено)
- ➖ `DEBUG=false` в проде — нет debug-режима; глобальный `onError` отдаёт generic 500 (стектрейс не утекает)
- ✅ Security headers B+ — CSP, X-Frame-Options, X-Content-Type, HSTS, Referrer-Policy, Permissions-Policy
- ✅ RBAC: admin-эндпоинты защищены — `role !== 'admin'` → 403; проверки владельца (`WHERE userId=?`)

## Платежи
- ➖ Bereke callback — не используется (по решению только PayPal)
- ✅ End-to-end тест на проде — живая sandbox-оплата подтверждена (pro=1, payments=$29.99)
- ✅ Failed payment → лог `payment_failed` + 402/502, Pro не выдаётся
- ⚠️ Refund endpoint — не реализован (не требовался; tech-debt)

## Мониторинг
- ✅ Dashboard — Cloudflare Workers & Pages → Metrics (requests/errors/p95/CPU)
- ⚠️ Минимум 2 алерта — настроить в Dashboard → Notifications (deployment failed + доступность)
- ⚠️ PostHog 10+ events + воронка — код готов (12 событий), активируется при `POSTHOG_KEY`
- ✅ JSON-логи доступны и читаемы — `logEvent()` → `wrangler pages deployment tail`

## Performance
- ⚠️ Locust 50+ users, failure < 1% — скрипт готов (`loadtest/`), прогнать на проде
- ✅ p95 latency < 500ms — smoke baseline 167–264ms avg (см. `loadtest/README.md`)
- ✅ N+1 queries исправлены — JOIN в `/api/company/candidates`, без циклов запросов
- ✅ Индексы на ключевых колонках — `sessions.userId`, `submissions.userId`, `payments.orderId` (UNIQUE) и др.

## Операции
- ✅ Runbook: 3+ сценария — `RUNBOOK.md` (сайт лежит, платежи, D1, брутфорс)
- ✅ Health check возвращает статус БД — `GET /api/health` → `{status, db}`
- ✅ Команда может перезапустить/откатить — Dashboard → Deployments → Rollback (мгновенно)
- ⚠️ Все задачи закрыты — недели 1–6 по коду готовы; внешние шаги: PostHog-ключ, прогон Locust, настройка алертов

---

### Осталось (для 100%):
1. Настроить 2 алерта в Cloudflare Notifications (dashboard, ~5 мин)
2. Прогнать Locust на проде, приложить `report.html`
3. Добавить `POSTHOG_KEY`, проверить события в PostHog Live Events
