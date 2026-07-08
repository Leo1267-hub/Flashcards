.PHONY: install db dev test stop reset-db revision upgrade downgrade

PYTHON := .venv/bin/python

install:
	$(PYTHON) -m pip install -r requirements.txt

db:
	docker compose up -d --wait

dev:
	docker compose up -d --wait
	$(PYTHON) -m alembic upgrade head
	@set -e; \
	$(PYTHON) -m uvicorn backend.main:app --reload & \
	backend_pid=$$!; \
	npm --prefix frontend run dev & \
	frontend_pid=$$!; \
	trap 'kill $$backend_pid $$frontend_pid 2>/dev/null' INT TERM EXIT; \
	wait $$backend_pid $$frontend_pid

test:
	docker compose up -d --wait
	$(PYTHON) -m pytest -s

stop:
	docker compose down

reset-db:
	docker compose down -v
	docker compose up -d --wait
	$(PYTHON) -m alembic upgrade head

revision:
	$(PYTHON) -m alembic revision --autogenerate -m "$(msg)"

upgrade:
	$(PYTHON) -m alembic upgrade head

downgrade:
	$(PYTHON) -m alembic downgrade -1
