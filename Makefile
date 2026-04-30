SHELL := /bin/bash
.DEFAULT_GOAL := help

# Derive a Docker-safe project name from the current git branch.
# Strips non-alphanumeric chars; falls back to "voyager" when git is unavailable.
GIT_BRANCH        := $(shell git rev-parse --abbrev-ref HEAD 2>/dev/null | tr -cs '[:alnum:]' '-' | sed 's/-*$$//')
COMPOSE_PROJECT_NAME ?= voyager-$(GIT_BRANCH)
export COMPOSE_PROJECT_NAME

COMPOSE_PROD := docker compose -f docker-compose.yml
COMPOSE_DEV  := docker compose -f docker-compose.yml -f docker-compose.dev.yml

# The external DB volume is fixed — not project-scoped — so all worktrees share one dataset.
DB_VOLUME := voyager_db_data

.PHONY: help \
        dev dev-d build build-d stop down logs logs-backend logs-frontend \
        shell-backend shell-frontend \
        db-init-volume db-shell db-dump db-restore db-migrate db-rollback db-makemigration \
        test

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
	  | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}'

# ── Core workflow ─────────────────────────────────────────────────────────────

db-init-volume: ## One-time: create the shared external DB volume (run once per machine)
	@docker volume inspect $(DB_VOLUME) > /dev/null 2>&1 \
	  && echo "Volume '$(DB_VOLUME)' already exists — skipping." \
	  || (docker volume create $(DB_VOLUME) && echo "Created volume '$(DB_VOLUME)'.")

dev: db-init-volume ## Start all services with hot-reload (foreground)
	$(COMPOSE_DEV) up --build

dev-d: db-init-volume ## Start all services with hot-reload (background)
	$(COMPOSE_DEV) up --build -d

build: db-init-volume ## Build and start production images (foreground)
	$(COMPOSE_PROD) up --build

build-d: db-init-volume ## Build and start production images (background)
	$(COMPOSE_PROD) up --build -d

stop: ## Stop containers (keeps volumes and images)
	$(COMPOSE_DEV) stop

down: ## Remove containers and networks (volumes are preserved)
	$(COMPOSE_DEV) down

logs: ## Tail logs for all services
	$(COMPOSE_DEV) logs -f

logs-backend: ## Tail backend logs only
	$(COMPOSE_DEV) logs -f backend

logs-frontend: ## Tail frontend logs only
	$(COMPOSE_DEV) logs -f frontend

# ── Shell access ──────────────────────────────────────────────────────────────

shell-backend: ## Open a shell in the running backend container
	$(COMPOSE_DEV) exec backend bash

shell-frontend: ## Open a shell in the running frontend container
	$(COMPOSE_DEV) exec frontend sh

# ── Database ──────────────────────────────────────────────────────────────────

db-shell: ## Open psql in the running db container
	$(COMPOSE_DEV) exec db psql -U $${POSTGRES_USER:-postgres} -d $${POSTGRES_DB:-voyager}

db-dump: ## Dump the shared DB to ./backups/dump_<timestamp>.sql
	@mkdir -p backups
	$(COMPOSE_DEV) exec db pg_dump \
	  -U $${POSTGRES_USER:-postgres} $${POSTGRES_DB:-voyager} \
	  > backups/dump_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Dump saved to backups/"

db-restore: ## Restore DB from FILE=path/to/dump.sql  (e.g. make db-restore FILE=backups/dump_….sql)
ifndef FILE
	$(error FILE is required. Usage: make db-restore FILE=backups/dump_20240101.sql)
endif
	$(COMPOSE_DEV) exec -T db psql \
	  -U $${POSTGRES_USER:-postgres} $${POSTGRES_DB:-voyager} < $(FILE)

db-migrate: ## Apply all pending Alembic migrations
	$(COMPOSE_DEV) exec backend alembic upgrade head

db-rollback: ## Roll back the last Alembic migration
	$(COMPOSE_DEV) exec backend alembic downgrade -1

db-makemigration: ## Generate a new Alembic migration  (e.g. make db-makemigration MSG="add user table")
ifndef MSG
	$(error MSG is required. Usage: make db-makemigration MSG="describe your change")
endif
	$(COMPOSE_DEV) exec backend alembic revision --autogenerate -m "$(MSG)"

# ── Tests ─────────────────────────────────────────────────────────────────────

test: ## Run backend and frontend tests
	$(COMPOSE_DEV) exec backend pytest tests/ -v
	$(COMPOSE_DEV) exec frontend npm test -- --watchAll=false
