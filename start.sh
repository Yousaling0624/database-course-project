#!/bin/bash
echo "Starting Pharmaceutical Sales Management System..."

# Check requirements
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed or not in PATH."
    echo "Please install Docker to run the database and application."
    echo "Download: https://www.docker.com/products/docker-desktop"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Error: Docker Compose is not installed."
    echo "Please install Docker Compose."
    exit 1
fi

echo "Building and starting services..."
docker-compose up --build -d

echo "------------------------------------------------"
echo "System Started!"
echo "Backend API: http://localhost:8080"
echo "Frontend UI: http://localhost:5173"
echo "Database:    localhost:3306"
echo ""
echo "Default Admin: admin / password"
echo "------------------------------------------------"
echo "To stop the system, run: docker-compose down"
