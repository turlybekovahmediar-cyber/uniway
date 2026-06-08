"""
backup_d1.py — UniWay D1 Database Backup
=========================================
Экспортирует все таблицы D1 через Cloudflare REST API в JSON-файлы.
Запускается из GitHub Actions (см. .github/workflows/backup.yml).

Переменные окружения (задаются в GitHub Secrets):
  CLOUDFLARE_API_TOKEN   — API-токен с правами D1:Read
  CLOUDFLARE_ACCOUNT_ID  — ID аккаунта Cloudflare
  D1_DATABASE_ID         — ID базы данных D1 (a1ab0ca3-...)
  BACKUP_TABLES          — (опц.) таблицы через запятую, пусто = все
"""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests

# ── Конфиг из окружения ──────────────────────────────────────────────────────

API_TOKEN   = os.environ.get("CLOUDFLARE_API_TOKEN", "")
ACCOUNT_ID  = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "")
DATABASE_ID = os.environ.get("D1_DATABASE_ID", "a1ab0ca3-6b13-45b2-870a-298721dc5371")
BACKUP_TABLES_ENV = os.environ.get("BACKUP_TABLES", "")

# Все таблицы схемы
ALL_TABLES = ["users", "sessions", "submissions", "interview_results"]

# Папка для дампов (относительно корня репо)
BACKUP_DIR = Path("backups")

# ── Cloudflare D1 REST API ───────────────────────────────────────────────────

BASE_URL = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/d1/database/{DATABASE_ID}"

HEADERS = {
    "Authorization": f"Bearer {API_TOKEN}",
    "Content-Type": "application/json",
}


def query(sql: str, params: list | None = None) -> list[dict]:
    """Выполнить SQL-запрос через D1 REST API и вернуть строки."""
    payload = {"sql": sql, "params": params or []}
    resp = requests.post(f"{BASE_URL}/query", headers=HEADERS, json=payload, timeout=30)

    if resp.status_code != 200:
        print(f"  ✗ HTTP {resp.status_code}: {resp.text[:300]}", file=sys.stderr)
        resp.raise_for_status()

    body = resp.json()
    if not body.get("success"):
        errors = body.get("errors", [])
        raise RuntimeError(f"D1 query failed: {errors}")

    # results — список объектов [{columns, rows, meta}]
    result_set = body.get("result", [])
    if not result_set:
        return []

    return result_set[0].get("results", [])


def get_row_count(table: str) -> int:
    rows = query(f"SELECT COUNT(*) as n FROM {table}")
    return int(rows[0]["n"]) if rows else 0


def export_table(table: str) -> dict:
    """Экспортировать таблицу целиком, возвращает мета + строки."""
    print(f"  📋 {table}... ", end="", flush=True)
    rows = query(f"SELECT * FROM {table}")

    # Для users убираем passwordHash из бэкапа (безопасность)
    if table == "users":
        for row in rows:
            row.pop("passwordHash", None)

    print(f"{len(rows)} rows")
    return {
        "table": table,
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "row_count": len(rows),
        "rows": rows,
    }


def run_backup() -> None:
    if not API_TOKEN or not ACCOUNT_ID:
        print("❌ CLOUDFLARE_API_TOKEN и CLOUDFLARE_ACCOUNT_ID обязательны", file=sys.stderr)
        sys.exit(1)

    # Определяем таблицы для бэкапа
    if BACKUP_TABLES_ENV.strip():
        tables = [t.strip() for t in BACKUP_TABLES_ENV.split(",") if t.strip()]
    else:
        tables = ALL_TABLES

    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M-%S")
    backup_dir = BACKUP_DIR / timestamp
    backup_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n🗄️  UniWay D1 Backup — {timestamp}")
    print(f"📁 Output: {backup_dir}")
    print(f"📊 Tables: {', '.join(tables)}\n")

    manifest = {
        "backup_time": timestamp,
        "database_id": DATABASE_ID,
        "tables": [],
        "total_rows": 0,
    }

    for table in tables:
        try:
            data = export_table(table)

            # Сохраняем каждую таблицу в отдельный JSON
            out_file = backup_dir / f"{table}.json"
            with open(out_file, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

            manifest["tables"].append({
                "name": table,
                "row_count": data["row_count"],
                "file": f"{table}.json",
            })
            manifest["total_rows"] += data["row_count"]

        except Exception as exc:
            print(f"  ✗ Ошибка при экспорте {table}: {exc}", file=sys.stderr)
            manifest["tables"].append({"name": table, "error": str(exc)})

    # Пишем манифест бэкапа
    manifest_file = backup_dir / "manifest.json"
    with open(manifest_file, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    # Обновляем latest.json — всегда указывает на последний бэкап
    latest_file = BACKUP_DIR / "latest.json"
    with open(latest_file, "w", encoding="utf-8") as f:
        json.dump({
            "latest_backup": timestamp,
            "total_rows": manifest["total_rows"],
            "tables": manifest["tables"],
        }, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Backup complete — {manifest['total_rows']} rows total")
    print(f"   Manifest: {manifest_file}")


if __name__ == "__main__":
    run_backup()
