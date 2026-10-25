# EvaluatorAI

EvaluatorAI is a free tool for creating timed multiple-choice tests to screen candidates. A test creator picks subjects, difficulty and a time limit, AI writes the questions, and the creator shares one link. Candidates take the test in the browser, and the creator sees each score and a per-question breakdown.

It is designed to run at zero cost on free tiers (Gemini API, Neon, Render, Vercel). Progress and plans are in [PROJECT_PLAN.md](PROJECT_PLAN.md) and [CHANGELOG.md](CHANGELOG.md).

## How it works

**Test creators**
1. Sign up with name, email and password.
2. Create a test: choose subjects (24 in 8 groups), difficulty (Easy, Medium, Hard or a mix), number of questions, test duration and how long the link stays open.
3. Review the questions with their correct answers and explanations, and remove any you don't want (until the first candidate starts).
4. Share the link, then follow results: status, score, unanswered questions, time used and every answer.

**Candidates**
1. Open the link and enter name and email. The timer starts when the server confirms the start.
2. Answer at their own pace. Answers save automatically, a refresh resumes the test with the right time left, and the test submits itself when time runs out.
3. One attempt per email per test.

**Admin** (the platform owner, created by `seed.py` only) manages the example question bank the AI uses as style examples, and can see all tests and results.

## Features

- **AI test generation:** one click generates the whole test from each subject's scope and Easy/Medium/Hard rubric, with example questions as style guides. Every question is checked (4 options, one valid answer, no duplicates), and correct answers are spread evenly across A–D. Large tests are split into parallel requests, short results get one follow-up request, and failures save nothing.
- **Daily AI limits** per creator and overall, to stay inside the provider's free quota. Without an AI key, questions are drawn from the example bank instead.
- **Two timers, enforced on the server:** the test duration (per candidate, auto-submit at zero) and the link validity (blocks new candidates, lets anyone mid-test finish). There are no background jobs; expired attempts are closed when next read.
- **Candidate test screen:** countdown based on the server deadline (changing the computer clock doesn't help), warnings at 5 and 1 minute, auto-save, resume, code blocks shown in monospace, and a phone-friendly layout.
- **Ownership:** creators only ever see their own tests and results.
- **Example question bank** (Admin): 144 starter questions, filters by group/subject/difficulty, search, and CSV import.
- **Hardening:**
  - per-IP rate limits on login (10 per 5 minutes) and sign-up (5 per hour);
  - CORS limited to the configured frontend;
  - "waking up the server" notice for the free plan's cold starts;
  - a `/health` endpoint.

## Tech stack

```
backend/    FastAPI, SQLAlchemy, PostgreSQL, Alembic, JWT auth, bcrypt
frontend/   Next.js 16, React 19, TypeScript, Tailwind CSS
render.yaml Render blueprint for the backend (rootDir: backend)
```

The AI client talks to any OpenAI-compatible chat completions API using only the Python standard library. Google Gemini is the default; Groq, OpenRouter or another endpoint work by changing environment variables.

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

# AI generation (leave AI_API_KEY empty to use the example question bank)
AI_PROVIDER=gemini
AI_MODEL=gemini-3.8-flash
AI_API_KEY=
AI_DAILY_LIMIT_PER_USER=5
AI_DAILY_LIMIT_GLOBAL=50
```

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | required | PostgreSQL connection string (`postgres://` URLs are accepted too) |
| `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES` | required | JWT signing and session length |
| `FRONTEND_URL` | none | Deployed frontend address(es), comma-separated, allowed by CORS. `http://localhost:3000` is always allowed |
| `AI_PROVIDER` | `gemini` | `gemini`, `groq` or `openrouter` |
| `AI_MODEL` | provider default | `gemini-3.8-flash` for Gemini, `openai/gpt-oss-120b` for Groq. Required for OpenRouter |
| `AI_API_KEY` | empty | Gemini keys: https://aistudio.google.com/apikey. Empty = use the question bank |
| `AI_BASE_URL` | provider default | Any other OpenAI-compatible endpoint |
| `AI_DAILY_LIMIT_PER_USER` | 5 | Successful AI tests per creator per day (Admin has no limit) |
| `AI_DAILY_LIMIT_GLOBAL` | 50 | AI attempts per day for everyone; keep it inside the provider's free quota |
| `AI_TIMEOUT_SECONDS` | 90 | Time limit per AI request |
| `AI_QUESTIONS_PER_CALL` | 20 | Bigger tests are split into several requests |
| `AI_MAX_PARALLEL_CALLS` | 3 | Requests run at the same time |
| `AI_MAX_OUTPUT_TOKENS` | 16000 | Reply length limit per request |
| `AI_RESPONSE_FORMAT` | `json_object` | Set to `none` for providers that reject JSON mode |
| `SQL_ECHO` | `false` | `true` logs every SQL statement |

Daily AI limits reset at 00:00 UTC.

The schema is managed only by Alembic. Run the migrations before starting the server (and again after pulling changes that add migrations), then seed:

```powershell
.\venv\Scripts\alembic upgrade head
.\venv\Scripts\python seed.py
.\venv\Scripts\uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs. Health check: http://localhost:8000/health.

`seed.py` is safe to re-run. It creates the roles, the subject catalogue (updating scopes and rubrics when `backend/app/data/subjects.py` changes), the starter example questions (`backend/app/data/example_questions.py`) and two demo users. Change their passwords before any real deployment:

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

Open http://localhost:3000. The frontend must run on port 3000 locally, because that's the origin the backend allows by default.

## Main API endpoints

| Area | Endpoints |
|---|---|
| Accounts | `POST /auth/signup`, `POST /auth/login`, `GET /auth/me` |
| Catalogue | `GET /subjects/`; Admin: `/questions/` (CRUD, filters, search) |
| Tests | `POST /tests/generate`, `GET /tests/generation-quota`, `GET /tests/my-tests`, `GET /tests/{code}`, `DELETE /tests/{id}/questions/{question_id}`, `DELETE /tests/{id}` |
| Candidates (public) | `GET /public/tests/{code}`, `POST /public/tests/{code}/start`, `GET /public/attempts/{token}`, `PUT /public/attempts/{token}/answers`, `POST /public/attempts/{token}/submit` |
| Results | `GET /candidates/results?test_code=`, `GET /candidates/result/{id}`, `DELETE /candidates/response/{id}` |

## Deployment

Deployment on free tiers is planned as the final step (see Phase 5 in [PROJECT_PLAN.md](PROJECT_PLAN.md)):

- **Database:** Neon PostgreSQL.
- **Backend:** Render free web service from `render.yaml`, with the environment variables above.
- **Frontend:** Vercel with Root Directory `frontend` and `NEXT_PUBLIC_API_URL` set to the backend URL. Then set `FRONTEND_URL` on the backend to the Vercel address.
