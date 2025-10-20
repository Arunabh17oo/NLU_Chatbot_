#!/bin/bash

# Docker Development Script for AI Chatbot Full Stack Application
# This script runs the application in development mode with hot reloading

set -e

echo "🔧 Starting AI Chatbot in Development Mode..."

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

# Start only database and backend in development mode
print_status "Starting database and backend services..."
$COMPOSE_CMD up -d mongodb

# Wait for MongoDB to be ready
print_status "Waiting for MongoDB to be ready..."
sleep 10

# Start backend in development mode (with volume mounting for hot reload)
print_status "Starting backend in development mode..."
cd chatbot-backend
npm install
npm run dev &
BACKEND_PID=$!

# Start frontend in development mode
print_status "Starting frontend in development mode..."
cd ../chatbot-frontend
npm install
npm run dev &
FRONTEND_PID=$!

print_success "🎉 Development environment started!"
echo ""
echo "📋 Development URLs:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:3001"
echo "   MongoDB: mongodb://localhost:27017"
echo ""
echo "🔧 Hot reloading is enabled for both frontend and backend"
echo "   Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    print_status "Stopping development services..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    $COMPOSE_CMD down
    print_success "Development services stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for processes
wait
