# Fit-Flow QMS — Local Physical Server Deployment Guide

This guide provides step-by-step instructions for deploying the **Fit-Flow Quality Management System (QMS)** backend and database on a dedicated local physical server (LAN / On-Premise) using Docker and Docker Compose.

---

## 1. Architecture Overview

```
                          ┌────────────────────────┐
                          │   Next.js 15 Client    │ (Port 3000)
                          │ (Frontend / PWA / Web) │
                          └───────────┬────────────┘
                                      │ HTTP / REST API / JWT
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Local Physical Server (Docker Compose)                                  │
│                                                                         │
│  ┌─────────────────────────────────┐   ┌─────────────────────────────┐  │
│  │     Django 4.2+ Backend (web)   │   │  PostgreSQL 15 (db)         │  │
│  │   • Gunicorn WSGI (Port 8000)   │──▶│  • Port 5432                │  │
│  │   • WhiteNoise (Static assets)  │   │  • Persistent Data Volume   │  │
│  │   • Auto DB Migrations on start │   └──────────────┬──────────────┘  │
│  └────────────────┬────────────────┘                  │                 │
│                   │                                   │                 │
│  ┌────────────────┴────────────────┐   ┌──────────────┴──────────────┐  │
│  │ Named Volume: `media_volume`    │   │ Named Volume:               │  │
│  │ (/app/media - Inspection photos)│   │ `postgres_data`             │  │
│  └─────────────────────────────────┘   └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Prerequisites on Local Server

Ensure the host machine (Ubuntu Server, Debian, Rocky Linux, or Windows Server with Docker Desktop) has:
- **Docker Engine**: `>= 24.0`
- **Docker Compose**: `>= v2.20`
- **Git**

Verify installation:
```bash
docker --version
docker compose version
```

---

## 3. Deployment Steps

### Step 1: Clone Repository & Navigate to Backend
```bash
git clone <your-repository-url> fitflow-qms
cd fitflow-qms/backend
```

### Step 2: Configure Environment Variables
Create your production `.env` file from the example template:
```bash
cp .env.production.example .env
```

Open `.env` in a text editor (e.g. `nano .env`) and configure:
```env
# ==============================================================================
# Core Django Configuration
# ==============================================================================
DJANGO_ENV=production
DJANGO_SETTINGS_MODULE=quality_check.settings.production

# Generate a strong key: python -c 'import secrets; print(secrets.token_urlsafe(50))'
DJANGO_SECRET_KEY=replace_with_a_secure_generated_secret_key_here

# Add your server IP address and domain name
ALLOWED_HOSTS=localhost,127.0.0.1,192.168.1.100,fitflow.local

# Ports
BACKEND_PORT=8000
POSTGRES_PORT=5432

# Database Credentials
POSTGRES_DB=fitflow_db
POSTGRES_USER=fitflow_admin
POSTGRES_PASSWORD=your_strong_postgres_password

# Frontend Origins (Add the IP/domain where Next.js runs)
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://192.168.1.100:3000
CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://192.168.1.100:3000

# Set to 1 if using an SSL/HTTPS reverse proxy (Nginx/Caddy)
SESSION_COOKIE_SECURE=0
CSRF_COOKIE_SECURE=0
```

### Step 3: Build & Start Containers
Run Docker Compose in detached mode:
```bash
docker compose up -d --build
```

Docker Compose will:
1. Spin up the `postgres:15-alpine` container with a healthcheck.
2. Build the Django `python:3.11-slim` container.
3. Automatically run database migrations (`python manage.py migrate`).
4. Collect all static assets via WhiteNoise (`python manage.py collectstatic`).
5. Start the production Gunicorn multi-worker server on `0.0.0.0:8000`.

### Step 4: Create Initial Admin Superuser
Once the containers are up, create the initial administrative account:
```bash
docker compose exec web python manage.py createsuperuser
```
Follow the interactive prompts to set the username, email, and password.

---

## 4. Persistent Storage & Backups

Two Docker named volumes are configured to guarantee zero data loss across container rebuilds or server restarts:

| Volume Name | Container Path | Description |
|---|---|---|
| `fitflow_postgres_data` | `/var/lib/postgresql/data` | All PostgreSQL database tables, evaluations, users, and audit logs. |
| `fitflow_media_volume` | `/app/media` | Uploaded sample photos, defect images, and technical attachments. |

### How to Backup the Database:
```bash
docker compose exec -T db pg_dump -U fitflow_admin fitflow_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### How to Restore the Database:
```bash
docker compose exec -T db psql -U fitflow_admin fitflow_db < backup_file.sql
```

### How to Backup Uploaded Media:
```bash
docker compose cp web:/app/media ./media_backup_$(date +%Y%m%d)
```

---

## 5. Frontend Connection Setup

In your `frontend-next` `.env.local` or production environment, point the API URL to the server's LAN IP:
```env
NEXT_PUBLIC_API_URL=http://192.168.1.100:8000
```
Build and run the Next.js frontend:
```bash
cd frontend-next
npm install
npm run build
npm run start
```

---

## 6. Daily Operations & Maintenance

| Command | Purpose |
|---|---|
| `docker compose ps` | View container status and health |
| `docker compose logs -f web` | Tail live Gunicorn application logs |
| `docker compose logs -f db` | Tail live PostgreSQL logs |
| `docker compose restart web` | Restart Django web server (zero DB downtime) |
| `docker compose down` | Stop containers (volumes remain untouched) |
| `docker compose up -d` | Start containers |
| `docker compose exec web python manage.py check` | Run Django system healthcheck |

---

## 7. Troubleshooting

- **Database Connection Refused**:
  Check if `db` container is healthy:
  ```bash
  docker compose ps
  ```
  Ensure `POSTGRES_PASSWORD` and `POSTGRES_USER` in `.env` match between services.

- **CORS Error in Browser**:
  Ensure the exact URL where the frontend is loaded in the browser (including port) is listed in `CORS_ALLOWED_ORIGINS` in `.env`.
  Example: `CORS_ALLOWED_ORIGINS=http://192.168.1.100:3000,http://localhost:3000`

- **Static Files Not Loading**:
  WhiteNoise serves static files directly from `/app/staticfiles`. If you updated code, re-collect static files:
  ```bash
  docker compose exec web python manage.py collectstatic --noinput --clear
  ```
