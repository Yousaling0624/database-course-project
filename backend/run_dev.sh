#!/bin/bash

# Ensure we are in the backend directory
cd "$(dirname "$0")"

echo "Checking if MySQL port is exposed..."
# Check if port 3306 is listening (simple check)
if ! nc -z localhost 3306 2>/dev/null; then
    echo "Warning: Port 3306 not accessible. Make sure 'docker-compose up -d mysql' is running and port is mapped."
    echo "You might need to run: docker-compose up -d mysql"
else
    echo "MySQL port 3306 is accessible."
fi

echo "Stopping Docker backend container to free up port 8080 (if running)..."
docker stop pharmacy_backend 2>/dev/null || true

echo "Starting Backend locally..."
echo "API will be available at http://localhost:8080"
export DSN="root:root@tcp(127.0.0.1:3306)/pharma_db?charset=utf8mb4&parseTime=True&loc=Local"
go run cmd/main.go
