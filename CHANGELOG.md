# Changelog

Progress against [PROJECT_PLAN.md](PROJECT_PLAN.md). Each phase is listed when it is completed, newest first.
To resume work, take the **first phase not marked Completed** below.

| Phase | Status | Completed on | Branch |
|---|---|---|---|
| 1. Accounts and subjects | ✅ Completed | 2026-10-24 | `phase-1-accounts-subjects` |
| 2. Test model, timers and candidate flow | ⏳ Next | — | — |
| 3. AI generation | Not started | — | — |
| 4. Polish and hardening | Not started | — | — |
| 5. Free deployment | Not started | — | — |

---

## Project renamed to EvaluatorAI (2026-10-24)
- Product name, logo initials (EA), API title, frontend package name and Render service names now use **EvaluatorAI**. The GitHub repository is renamed to `EvaluatorAI`.
- The local database name in the setup steps (`interview_test_db`) is unchanged, so existing local databases keep working.

---

## Phase 1: Accounts and subjects (Completed 2026-10-24)

### Added
- **Creator sign-up:** `POST /auth/signup` (name, email, password 8–72 characters) creates a Creator account and logs them in. New sign-up page and a public landing page.
- **Current user endpoint:** `GET /auth/me`. The frontend saves the user and role after login and fetches them if missing.
- **Subject catalogue:** 24 subjects in 8 groups (`backend/app/data/subjects.py`). Each has a topic scope and Easy/Medium/Hard rubrics for the AI prompt. `GET /subjects` returns them with example-question counts. New read-only **Subjects** page for Admin.
- **Starter example question bank:** 144 questions, 2 per subject per difficulty (`backend/app/data/example_questions.py`). Easy questions are theory; Medium and Hard are technical. Correct answers are spread evenly across A–D.
- **Database migration** `b7e4d2a91c55`: creates `subjects`, moves questions to `subject_id` (matched by name), and drops `categories`. Questions with no match are kept as Unassigned. Includes a working downgrade.
- **Role-based navigation:** Creators see Dashboard, Tests and Results; Admin also sees Subjects and Questions. Admin-only pages redirect other users. The header shows the user's name and role.

### Changed
- **Subjects replace categories** everywhere: question CRUD, filters (group, subject, difficulty, search, unassigned), the question form, CSV import (`subject` column) and the manual test builder.
- **Per-creator ownership:** Creators only see their own tests and results. They can delete their own results; Admin can access everything.
- **Login:** emails are case-insensitive, and the same "Invalid email or password" message is shown for an unknown email and a wrong password.
- **Validation errors** give the real reason (e.g. "password must be at least 8 characters").
- **CSV import** reports which rows failed and why.
- **Database setup:** the schema is managed only by Alembic. The server no longer creates tables on startup.
- **`seed.py`** is safe to re-run. It updates subject rubrics and adds missing example questions without duplicating.

### Removed
- **Public `POST /users/`:** it allowed anyone to create an Admin account; it is now Admin-only.
- **Categories:** the table, routes, page and modal components, and the unused `GET /tests/questions` endpoint.

### Known, deferred
- Code snippets in questions show as plain text until Phase 2 adds code formatting.
- Lint warnings that already existed in the frontend, and a harmless passlib/bcrypt version warning, are left for Phase 4.

---

## Before the phased plan (2026-10-24)
- Fixed result details opening the wrong record, blank answers on the result page, the skip vs. "answer everything" conflict, 2-option questions failing to save, the wrong test link in Test Preview, and the login error disappearing.
- Added test deletion.
- Merged the separate backend and frontend repositories into one repository, keeping their history.
