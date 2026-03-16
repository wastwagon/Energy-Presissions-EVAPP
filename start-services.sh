#!/bin/bash

# Script to start all EV Billing services
# This script checks Docker status and starts all required services

echo "=========================================="
echo "EV Billing - Service Startup Script"
echo "=========================================="
echo ""

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running!"
    echo ""
    echo "Please start Docker Desktop first:"
    echo "  1. Open Docker Desktop application"
    echo "  2. Wait for it to fully start (whale icon in menu bar)"
    echo "  3. Run this script again"
    echo ""
    echo "Or run: open -a Docker"
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Navigate to project directory
cd "$(dirname "$0")"

echo "Starting all services..."
echo ""

# Start services
docker-compose up -d

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Services started successfully!"
    echo ""
    echo "Waiting for services to initialize..."
    sleep 10
    
    echo ""
    echo "=========================================="
    echo "Service Status:"
    echo "=========================================="
    docker-compose ps
    
    echo ""
    echo "=========================================="
    echo "Access URLs:"
    echo "=========================================="
    echo "Frontend Dashboard:"
    echo "  http://localhost:8080"
    echo ""
    echo "Backend API:"
    echo "  http://localhost:3000/api"
    echo "  http://localhost:3000/api/docs (Swagger)"
    echo ""
    echo "OCPP Gateway:"
    echo "  http://localhost:9000/health"
    echo ""
    echo "Database (PostgreSQL):"
    echo "  localhost:5432"
    echo ""
    echo "Redis:"
    echo "  localhost:6379"
    echo ""
    echo "MinIO Console:"
    echo "  http://localhost:9001"
    echo ""
    echo "=========================================="
    echo ""
    echo "Services are starting up. It may take 30-60 seconds"
    echo "for all services to be fully ready."
    echo ""
    echo "To check logs:"
    echo "  docker-compose logs -f [service-name]"
    echo ""
    echo "To stop services:"
    echo "  docker-compose down"
    echo ""
else
    echo ""
    echo "❌ Failed to start services"
    echo "Check Docker Desktop is running and try again"
    exit 1
fi
