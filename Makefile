# Makefile for Docker operations
.PHONY: help build up down restart logs clean ps shell-db shell-api shell-redis

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

build: ## Build all Docker images
	docker-compose build

up: ## Start all services
	docker-compose up -d

up-dev: ## Start all services in development mode
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

up-prod: ## Start all services in production mode
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## Show logs from all services
	docker-compose logs -f

logs-api: ## Show logs from API service
	docker-compose logs -f api

logs-db: ## Show logs from database
	docker-compose logs -f postgres

ps: ## Show running containers
	docker-compose ps

clean: ## Stop and remove all containers, networks, and volumes
	docker-compose down -v
	docker system prune -f

shell-db: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U evbilling -d ev_billing_db

shell-api: ## Open shell in API container
	docker-compose exec api sh

shell-redis: ## Open Redis CLI
	docker-compose exec redis redis-cli

db-reset: ## Reset database (WARNING: Deletes all data)
	docker-compose down -v postgres
	docker-compose up -d postgres

db-backup: ## Backup database
	docker-compose exec postgres pg_dump -U evbilling ev_billing_db > backup_$(shell date +%Y%m%d_%H%M%S).sql

db-restore: ## Restore database from backup (usage: make db-restore FILE=backup.sql)
	docker-compose exec -T postgres psql -U evbilling ev_billing_db < $(FILE)

install: ## Install dependencies (run in containers)
	docker-compose exec api npm install
	docker-compose exec frontend npm install

test: ## Run tests
	docker-compose exec api npm test

migrate: ## Run database migrations
	docker-compose exec api npm run migrate

seed: ## Seed database with sample data
	docker-compose exec api npm run seed

tools: ## Start development tools (pgAdmin, Redis Commander)
	docker-compose --profile tools up -d pgadmin redis-commander



