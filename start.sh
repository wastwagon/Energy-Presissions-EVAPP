#!/bin/bash

# Quick Start Script for EV Charging Billing Software
# This script helps you get started with Docker setup

set -e

echo "🚗 EV Charging Billing Software - Docker Setup"
echo "=============================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ .env file created. Please edit it with your configuration."
    else
        echo "⚠️  .env.example not found. Creating basic .env file..."
        cat > .env << 'ENVEOF'
NODE_ENV=development
PORT=3000
OCPP_WEBSOCKET_PORT=9000
DATABASE_URL=postgresql://evbilling:evbilling_password@postgres:5432/ev_billing_db
REDIS_URL=redis://redis:6379
JWT_SECRET=change_this_in_production
ENVEOF
    fi
    echo ""
fi

# Ask user what they want to do
echo "What would you like to do?"
echo "1) Start development environment"
echo "2) Start production environment"
echo "3) Start with development tools (pgAdmin, Redis Commander)"
echo "4) Stop all services"
echo "5) View logs"
echo "6) Exit"
echo ""
read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Starting development environment..."
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
        echo ""
        echo "✅ Services started!"
        echo ""
        echo "📍 Access your services:"
        echo "   - API: http://localhost:3000"
        echo "   - Frontend: http://localhost:3001"
        echo "   - Database: localhost:5432"
        echo "   - Redis: localhost:6379"
        echo ""
        echo "📊 View logs: docker-compose logs -f"
        echo "🛑 Stop services: docker-compose down"
        ;;
    2)
        echo ""
        echo "🚀 Starting production environment..."
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
        echo ""
        echo "✅ Services started!"
        ;;
    3)
        echo ""
        echo "🚀 Starting development environment with tools..."
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml --profile tools up -d
        echo ""
        echo "✅ Services started!"
        echo ""
        echo "📍 Access your services:"
        echo "   - API: http://localhost:3000"
        echo "   - Frontend: http://localhost:3001"
        echo "   - pgAdmin: http://localhost:5050 (admin@evbilling.com / admin)"
        echo "   - Redis Commander: http://localhost:8081"
        ;;
    4)
        echo ""
        echo "🛑 Stopping all services..."
        docker-compose down
        echo "✅ Services stopped"
        ;;
    5)
        echo ""
        echo "📊 Showing logs (Press Ctrl+C to exit)..."
        docker-compose logs -f
        ;;
    6)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac



