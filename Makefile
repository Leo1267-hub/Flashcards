.PHONY: install db dev test stop reset-db

install:
	pip install -r requirements.txt

db:
	docker compose up -d

dev:
	docker compose up -d
	uvicorn backend.main:app --reload

test:
	docker compose up -d
	pytest -s

stop:
	docker compose down

reset-db:
	docker compose down -v
	docker compose up -d