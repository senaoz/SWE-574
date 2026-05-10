# Backend (FastAPI)

## Setup

From the project root:

```bash
# Create/use venv, then:
pip install -r backend/requirements.txt
```

## Run (Local Development)

**Important:** Run from the `backend` directory so `app` is the package. Do not run `python app/main.py` directly (relative imports will fail).

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

With venv from project root:

```bash
cd backend && ../.venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API: http://localhost:8000
- Swagger Docs: http://localhost:8000/docs

## Run with Docker

Start the full stack (MongoDB + Backend + Frontend) from the project root:

```bash
docker compose up -d --build
```

Or start only the backend and database:

```bash
docker compose up -d --build backend mongodb
```

| Service  | Port  | Description                        |
|----------|-------|------------------------------------|
| Frontend | 80    | Nginx serving React SPA            |
| Backend  | 8000  | FastAPI (Uvicorn)                  |
| MongoDB  | 38017 | MongoDB 7 (mapped from 27017)      |

## Live Deployment

| Resource | URL |
|----------|-----|
| Live Application | https://swe.gnahh5.easypanel.host/ |
| Backend API Docs | https://backend-swe.gnahh5.easypanel.host/docs |
| GitHub Actions | https://github.com/senaoz/SWE-574/actions |

### Test Accounts

| Role | Email | Password |
|------|-------|----------|
| User | elif.sahin@example.com | Password123 |
| Admin | tazeyta@gmail.com | Password123 |
| User | mehmet.demir@example.com | Password123 |

## CI/CD

Deployment is automated via **GitHub Actions**. The workflow is defined in [`.github/workflows/deploy-easypanel.yml`](../.github/workflows/deploy-easypanel.yml) and can be monitored at the [Actions tab](https://github.com/senaoz/SWE-574/actions).

### How it works

1. A push to the `main` branch (or a manual trigger via `workflow_dispatch`) starts the **Deploy to Easypanel** workflow.
2. The workflow sends a deployment request to the Easypanel instance, which pulls the latest code, builds the Docker images, and restarts the services.
3. The workflow verifies the HTTP response code and fails the run if deployment was unsuccessful.

### Deployment Architecture

```
GitHub (push to main)
        │
        ▼
GitHub Actions (Deploy to Easypanel)
        │
        ▼
┌─────────────────────────────────┐
│        Easypanel Host           │
│  ┌───────────────────────────┐  │
│  │     docker-compose        │  │
│  │  ┌─────────┐ ┌─────────┐ │  │
│  │  │Frontend │ │ Backend │ │  │
│  │  │ Nginx   │ │ FastAPI │ │  │
│  │  │  :80    │ │  :8000  │ │  │
│  │  └────┬────┘ └────┬────┘ │  │
│  │       │   /api/   │      │  │
│  │       └─────►─────┘      │  │
│  │             │             │  │
│  │       ┌─────▼─────┐      │  │
│  │       │  MongoDB   │      │  │
│  │       │   :27017   │      │  │
│  │       └───────────┘      │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

- **Frontend** container builds the React app and serves static files through Nginx. API calls to `/api/` are reverse-proxied to the backend.
- **Backend** container runs FastAPI with Uvicorn on port 8000.
- **MongoDB** container provides the database with a persistent volume (`mongo_data`).
