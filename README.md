# Candidate Evaluation Platform

An interview test platform. An admin builds a question bank by category, picks questions to create a test, and shares the test link with candidates. Candidates take the test in the browser, and answers are scored automatically for the admin to review.

## Repository layout

```
backend/    FastAPI + SQLAlchemy + PostgreSQL API (Alembic migrations, JWT auth)
frontend/   Next.js 16 + React 19 + Tailwind admin dashboard and candidate test pages
render.yaml Render blueprint for the backend (rootDir: backend)
```

## Features

- Admin / Creator roles with JWT login
- Categories with sub-categories
- Question bank: create, edit, delete, filter, CSV bulk import
- Test builder: pick questions by category and difficulty; each test gets a unique `TEST-XXXXXXXX` code and link
- Candidate flow: name/email entry, timed test, question navigator, submit with auto-scoring
- Results: list of all submissions and a per-question breakdown

## Local setup

Prerequisites: Python 3.11+, Node.js 20+, PostgreSQL.

### 1. Database

```powershell
psql -U postgres -c "CREATE DATABASE interview_test_db;"
```

### 2. Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\python -m pip install -r requirements.txt
```

Create `backend/.env`:

```
DATABASE_URL=postgresql://postgres:YOUR_PG_PASSWORD@localhost:5432/interview_test_db
SECRET_KEY=change-me-to-any-long-random-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

Run migrations **before** the first server start (the app auto-creates missing tables on startup, which would make the first migration fail):

```powershell
.\venv\Scripts\alembic upgrade head
.\venv\Scripts\python seed.py
.\venv\Scripts\uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

`seed.py` creates two demo users (change these before any real deployment):

| Role | Email | Password |
|---|---|---|
| Admin | admin@gmail.com | admin123 |
| Creator | creator@gmail.com | creator123 |

### 3. Frontend

```powershell
cd frontend
npm install
```

Create `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

```powershell
npm run dev
```

Open http://localhost:3000. The frontend must run on port 3000 locally, because the backend's CORS list only allows that origin (see `backend/app/main.py`).

## Deployment

- **Backend (Render):** `render.yaml` at the repo root defines the API service and a PostgreSQL database, with `rootDir: backend`.
- **Frontend (Vercel):** import the repo, set **Root Directory** to `frontend`, and set `NEXT_PUBLIC_API_URL` to the backend URL.
- Add the deployed frontend URL to `ALLOWED_ORIGINS` in `backend/app/main.py`.
