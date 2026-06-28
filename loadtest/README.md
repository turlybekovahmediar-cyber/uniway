# Нагрузочное тестирование (OPS-006)

## Запуск Locust

```bash
pip install locust

locust -f loadtest/locustfile.py --headless \
  -u 100 -r 10 --run-time 2m \
  --host https://webapp-f21.pages.dev \
  --html loadtest/report.html
```

- `-u 100` — 100 одновременных пользователей
- `-r 10` — прирост 10 пользователей/сек
- `--run-time 2m` — 2 минуты
- `--html` — HTML-отчёт (прикрепить к сдаче)

Стратегия: прогнать **10 → 50 → 100** пользователей. Где failure rate спайкает — там текущий предел.

## Целевые показатели

| Метрика | Цель | Критично |
|---|---|---|
| Failure rate | < 1% | > 5% |
| p95 latency | < 500 ms | > 2 s |

## Что нагружаем

Только **публичные** эндпоинты: `/`, `/api/tasks`, `/api/tasks/:id`, `/api/health`.
Логин/регистрацию **не** нагружаем — они под Turnstile CAPTCHA и rate-limit (5/мин),
массовый трафик туда заблокируется по дизайну (это правильное поведение).

## Baseline (smoke, 12 запросов/эндпоинт, из CI-окружения)

| Эндпоинт | avg | max |
|---|---|---|
| `GET /` | 173 ms | 263 ms |
| `GET /api/tasks` | 199 ms | 277 ms |
| `GET /api/tasks?direction=IT` | 176 ms | 420 ms |
| `GET /api/tasks/:id` | 167 ms | 275 ms |
| `GET /api/health` | 264 ms | 541 ms |

Все ответы `200`. `/api/health` чуть медленнее — делает `SELECT 1` к D1.
Каталог заданий кэшируется на edge (Cloudflare Cache API), поэтому держит нагрузку хорошо.

> Cloudflare Workers масштабируются автоматически (нет фиксированного числа инстансов),
> поэтому «breaking point» по CPU/RAM как на VPS здесь не наступает — узким местом
> при росте станут лимиты D1 (запросы/сек), а не сам Worker.
