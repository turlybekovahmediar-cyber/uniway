"""
UniWay — нагрузочный тест (OPS-006)
====================================
Симулирует пользователей, которые ходят по ПУБЛИЧНЫМ эндпоинтам.
Логин/регистрация не нагружаем намеренно: они защищены Turnstile CAPTCHA
и rate-limit'ом (5/мин), поэтому массовый трафик туда бессмыслен и был бы
заблокирован по дизайну.

Установка:  pip install locust
Запуск (100 пользователей, 2 минуты, HTML-отчёт):
  locust -f loadtest/locustfile.py --headless \
    -u 100 -r 10 --run-time 2m \
    --host https://webapp-f21.pages.dev \
    --html loadtest/report.html

Стратегия: прогнать 10 -> 50 -> 100 пользователей. Где failure rate
спайкает — там текущий предел.

Целевые показатели:
  - Failure rate: < 1%   (> 5% — критично)
  - p95 latency:  < 500ms (> 2s — пользователи уходят)
"""
from locust import HttpUser, task, between


class UniWayVisitor(HttpUser):
    wait_time = between(1, 3)

    @task(5)  # самый частый — главная страница (SPA shell)
    def home(self):
        self.client.get("/", name="GET /")

    @task(4)  # каталог заданий (кэшируется на edge)
    def tasks(self):
        self.client.get("/api/tasks", name="GET /api/tasks")

    @task(3)  # фильтр по направлению
    def tasks_filtered(self):
        self.client.get("/api/tasks?direction=IT", name="GET /api/tasks?direction")

    @task(2)  # конкретное задание
    def task_detail(self):
        self.client.get("/api/tasks/101", name="GET /api/tasks/:id")

    @task(1)  # health check
    def health(self):
        self.client.get("/api/health", name="GET /api/health")
