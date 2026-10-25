# EvaluatorAI

EvaluatorAI is an interview test platform. Test creators sign up, build a test from subjects in the catalogue, and share the test link with candidates. Candidates take the test in the browser, and answers are scored automatically for the creator to review.

The platform is being turned into a free, public, AI-powered test generator in phases. See [PROJECT_PLAN.md](PROJECT_PLAN.md) for the plan and current status.

## Repository layout

```
backend/    FastAPI + SQLAlchemy + PostgreSQL API (Alembic migrations, JWT auth)
frontend/   Next.js 16 + React 19 + Tailwind admin dashboard and candidate test pages
render.yaml Render blueprint for the backend (rootDir: backend)
```

## Features

- Public sign-up for test creators (email + password), JWT login; Admin accounts come from `seed.py` only
- Each creator sees only their own tests and results; Admin sees everything
- Fixed catalogue of 24 subjects in 8 groups, each with a topic scope and Easy/Medium/Hard rubric (`backend/app/data/subjects.py`)
- Example question bank (Admin): 144 starter questions, create, edit, delete, filter by group/subject/difficulty, search, CSV bulk import
- Test generation: pick subjects, difficulties, number of questions, duration and link validity; the questions are drawn from the example bank for now (AI generation comes next). Each test gets a unique `TEST-XXXXXXXX` code and link
- View a test with correct answers and remove questions until the first candidate starts
- Candidate flow: name/email entry, server-enforced countdown, answers saved as you go, refresh resumes, auto-submit when time runs out, one attempt per email
- Link validity: an expired link blocks new candidates while anyone mid-test can finish
- Results: status (submitted / timed out / in progress), score, unanswered count, time used and a per-question breakdown

## Local setup

Prerequisites: Python 3.11+, Node.js 20+, PostgreSQL.

### 1. Database

Any local PostgreSQL works:

```powershell
psql -U postgres -c "CREATE DATABASE interview_test_db;"
```

On the main development machine the project has its own PostgreSQL instance (port 5433, data in `%LOCALAPPDATA%\EvaluatorAI\pgdata`, credentials in `backend/.env`). It doesn't start on boot; start it with:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" -D "$env:LOCALAPPDATA\EvaluatorAI\pgdata" -o "-p 5433" -l "$env:LOCALAPPDATA\EvaluatorAI\postgres.log" start
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

The database schema is managed only by Alembic, so run the migrations before starting the server (and again after pulling changes that add migrations). Then seed:

```powershell
.\venv\Scripts\alembic upgrade head
.\venv\Scripts\python seed.py
.\venv\Scripts\uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

`seed.py` is safe to re-run. It creates the roles, the subject catalogue (updating scopes and rubrics when `subjects.py` changes), the starter example questions (`backend/app/data/example_questions.py`, skipping ones already present) and two demo users (change these before any real deployment):

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
