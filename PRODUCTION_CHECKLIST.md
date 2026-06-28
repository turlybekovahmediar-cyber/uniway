# Чеклист готовности к продакшену (OPS-008)

Адаптировано под стек **Cloudflare Pages/Workers + D1** 
Статус на 2026-06-28. ✅ готово · ⚠️ частично · ➖ не применимо к стеку

## Инфраструктура
- ✅ Домен + HTTPS (зелёный замок) — `webapp-f21.pages.dev`, авто-TLS Cloudflare
- ✅ CI/CD деплой на push в `main` — GitHub Actions → `wrangler pages deploy --branch=production`
- ➖ Docker `restart: unless-stopped` — Workers перезапускаются/масштабируются автоматически (serverless)
- ✅ Бэкап БД — `backup.yml` (D1 экспорт по расписанию)

## Безопасность
- ✅ Секреты не в git, `.env` в `.gitignore`
- ➖ `DEBUG=false` в проде нет debug-режима. глобальный `onError` отдаёт generic 500 
- ✅ Security headers B+ — CSP, X-Frame-Options, X-Content-Type, HSTS, Referrer-Policy, Permissions-Policy
- ✅ RBAC: admin-эндпоинты защищены: `role !== 'admin'` → 403; проверки владельца (`WHERE userId=?`)

## Платежи
- ➖ Bereke callback — не используется, только PayPal
- ✅ End-to-end тест на проде — живая sandbox-оплата 
- ✅ Failed payment → лог `payment_failed` + 402/502, Pro не выдаётся
- ⚠️ Refund endpoint — не реализован (не требовался; tech-debt)

## Мониторинг
- ✅ Dashboard — Cloudflare Workers & Pages → Metrics (requests/errors/p95/CPU)
- ⚠️ Минимум 2 алерта — настроить в Dashboard → Notifications (deployment failed + доступность)
- ⚠️ PostHog 10+ events + воронка — код готов (12 событий), активируется при `POSTHOG_KEY`
- ✅ JSON-логи доступны и читаемы — `logEvent()` → `wrangler pages deployment tail`

## Performance
- ⚠️ Locust 50+ users, failure < 1% — скрипт готов (`loadtest/`)
- ✅ p95 latency < 500ms — smoke baseline 167–264ms avg (см. `loadtest/README.md`)
- ✅ N+1 queries исправлены — JOIN в `/api/company/candidates`, без циклов запросов
- ✅ Индексы на ключевых колонках — `sessions.userId`, `submissions.userId`, `payments.orderId` (UNIQUE) и др.

## Операции
- ✅ Runbook: 3+ сценария — `RUNBOOK.md` 
- ✅ Health check возвращает статус БД — `GET /api/health` → `{status, db}`
- ✅ Команда может перезапустить/откатить — Dashboard → Deployments → Rollback 

---

### Осталось:
1. Настроить 2 алерта в Cloudflare Notifications
2. Добавить `POSTHOG_KEY`, проверить события в PostHog Live Events
