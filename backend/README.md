# Backend (FastAPI)

## Setup

From the project root:

```bash
# Create/use venv, then:
pip install -r backend/requirements.txt
```

## Run

**Important:** Run from the `backend` directory so `app` is the package. Do not run `python app/main.py` directly (relative imports will fail).

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

With venv from project root:

```bash
cd backend && ../.venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API: http://localhost:8000  
Docs: http://localhost:8000/docs
