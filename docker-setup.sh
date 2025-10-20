#!/bin/bash

# Docker Setup Script for AI Chatbot Full Stack Application
# This script sets up and runs the entire application using Docker

set -e

echo "🚀 Setting up AI Chatbot Full Stack Application with Docker..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed (try both old and new syntax)
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Set compose command based on what's available
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_CMD="docker compose"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from env.example..."
    if [ -f "env.example" ]; then
        cp env.example .env
        print_success ".env file created from env.example"
        print_warning "Please edit .env file with your actual configuration values before running the application."
    else
        print_error "env.example file not found. Please create a .env file manually."
        exit 1
    fi
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p mongo-init
mkdir -p chatbot-backend/uploads
mkdir -p chatbot-frontend/dist

# Build and start services
print_status "Building and starting Docker containers..."
$COMPOSE_CMD down --remove-orphans
$COMPOSE_CMD build --no-cache
$COMPOSE_CMD up -d

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 30

# Check service health
print_status "Checking service health..."

# Check MongoDB (Using Atlas - no local container)
print_status "Using MongoDB Atlas - skipping local MongoDB health check"

# Check Backend
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    print_success "Backend API is healthy"
else
    print_warning "Backend API health check failed"
fi

# Check Frontend
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    print_success "Frontend is healthy"
else
    print_warning "Frontend health check failed"
fi

print_success "🎉 Docker setup completed!"
echo ""
echo "📋 Application URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:3001"
echo "   Database: MongoDB Atlas (Cloud)"
echo ""
echo "🔧 Useful Commands:"
echo "   View logs: $COMPOSE_CMD logs -f"
echo "   Stop services: $COMPOSE_CMD down"
echo "   Restart services: $COMPOSE_CMD restart"
echo "   View service status: $COMPOSE_CMD ps"
echo ""
echo "⚠️  Important: Make sure to update your .env file with actual values before using the application!"
