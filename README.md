# Task Manager (three-tier) - app1TaskManager

This folder contains a simple three-tier Task Manager: frontend (Nginx + static), backend (Node/Express), and db (MySQL). The frontend calls the backend on port 3000, and the backend connects to the `db` service.

Quick start (Docker Compose):

1. Build and start all services:

   docker compose up --build

2. Open the frontend in your browser:

   http://localhost:8080

Notes:
- The frontend statically calls `http://localhost:3000` in `frontend/index.html` by default. When run via compose the backend is exposed on host port 3000.
- The DB is seeded from `init.sql` on first container startup.
