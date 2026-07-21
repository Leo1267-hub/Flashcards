.PHONY: setup install db dev test stop reset-db revision upgrade downgrade

PYTHON_BOOTSTRAP ?= python3
PYTHON := .venv/bin/python

setup:
	$(PYTHON_BOOTSTRAP) -m venv .venv
	$(PYTHON) -m pip install --upgrade pip
	$(PYTHON) -m pip install -r requirements.txt
	npm --prefix frontend ci
	@echo "Setup complete. Activate the virtual environment with: source .venv/bin/activate"

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
	$(PYTHON) -m pytest -s tests
	npm --prefix frontend test

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
