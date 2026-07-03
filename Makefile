.PHONY: install db dev test stop reset-db revision upgrade downgrade

install:
	pip install -r requirements.txt

db:
	docker compose up -d

dev:
	docker compose up -d
	alembic upgrade head
	uvicorn backend.main:app --reload

test:
	docker compose up -d
	pytest -s

stop:
	docker compose down

reset-db:
	docker compose down -v
	docker compose up -d
	alembic upgrade head

revision:
	alembic revision --autogenerate -m "$(msg)"

upgrade:
	alembic upgrade head

downgrade:
	alembic downgrade -1
