# Pharmaceutical Sales Management System (医药销售管理系统)

A full-stack sales management system built with Go (Backend) and React (Frontend).

## Tech Stack
- **Backend**: Go, Gin, GORM, MySQL
- **Frontend**: React, Vite, Tailwind CSS, React Router

## Prerequisites
- **Go**: Version 1.18+
- **Node.js**: Version 16+
- **MySQL**: Running on `localhost:3306`
  - Create a database named `pharma_db` (or it will accept the default connection if root has no password, otherwise update `backend/cmd/main.go`)

## Quick Start

### 1. Start the Backend
Open a terminal in the `backend` directory:
```bash
cd backend
go run cmd/main.go
# Server starts at http://localhost:8080
```
*Note: The system will automatically migrate database tables and create a default admin user (admin/password).*

### 2. Start the Frontend
Open a new terminal in the `frontend` directory:
```bash
cd frontend
npm install # Only needed first time
npm run dev
# App starts at http://localhost:3000
```

## Features
- **Dashboard**: Real-time sales and stock metrics.
- **Inventory**: Manage medicines, prices, and stock levels.
- **Sales**: Process customer orders and update stock automatically.
- **Purchasing**: Register inbound stock from suppliers.
- **Personnel**: Manage employee accounts.
