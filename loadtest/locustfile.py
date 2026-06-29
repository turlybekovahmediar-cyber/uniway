from locust import HttpUser, task, between


class UniWayVisitor(HttpUser):
    wait_time = between(1, 3)

    @task(5)  # главная страница (SPA shell)
    def home(self):
        self.client.get("/", name="GET /")

    @task(4)  # каталог заданий
    def browse_tasks(self):   # NB: метод нельзя называть 'tasks' — это зарезервированный атрибут Locust
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
