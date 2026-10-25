# Changelog

Progress against [PROJECT_PLAN.md](PROJECT_PLAN.md). Each phase is listed when it is completed, newest first.
To resume work, take the **first phase not marked Completed** below.

| Phase | Status | Completed on | Branch |
|---|---|---|---|
| 1. Accounts and subjects | ✅ Completed | 2026-10-24 | `phase-1-accounts-subjects` |
| 2. Test model, timers and candidate flow | ✅ Completed | 2026-10-25 | `phase-2-tests-timers-candidate-flow` |
| 3. AI generation | ✅ Code completed (quality check needs the AI key) | 2026-10-25 | `phase-3-ai-generation` |
| 4. Polish and hardening | ✅ Completed | 2026-10-25 | `phase-4-polish-hardening` |
| 5. Free deployment | ⏳ Next (needs Neon, Render and Vercel accounts) | — | — |

---

## Phase 4: Polish and hardening (Completed 2026-10-25)

### Added
- **Phone layout for creator pages:** a top bar with a slide-in menu replaces the fixed sidebar below tablet width. My Tests and Results show one card per item on phones, with all actions visible. Page padding shrinks on small screens, and the top bar wraps and hides the user's name when space is tight.
- **"Waking up the server" notice:** any request still pending after 5 seconds shows a small notice, because the free backend sleeps when idle. AI generation is excluded, since it's slow by nature and has its own message.
- **Page titles and metadata:**
  - Every page sets its browser tab title (e.g. "My Tests · EvaluatorAI", "Phone Tester · Results · EvaluatorAI").
  - The landing page has a description, keywords and Open Graph tags, and there's a favicon.
- **Rate limiting** (per IP, in memory):
  - Login: 10 attempts per 5 minutes. Sign-up: 5 per hour.
  - Answers 429 with a "please wait N minutes" message and a `Retry-After` header.
  - Behind a proxy, the address the proxy added to `X-Forwarded-For` is used, not one the client can fake.
- **`FRONTEND_URL`** (comma-separated) sets the allowed CORS origins; `http://localhost:3000` is always allowed.
- **`GET /health`** reports whether the database answers, for checks and uptime monitors.
- **`SQL_ECHO`:** SQL statement logging is now off by default.

### Changed
- **Password hashing** uses the `bcrypt` library directly instead of passlib. Existing hashes keep working, the "error reading bcrypt version" warning is gone, and passwords are cut to bcrypt's 72-byte limit explicitly.
- **Error messages:** every page shows the API's own message or "Could not reach the server" through shared helpers. This replaces all `catch (err: any)` code.
- **Login state** comes from a shared hook, replacing the "mounted" state pattern. Login and logout update the page immediately, including across tabs.
- **Login page** uses the same full-page layout as sign-up.
- The **Results pages** have the standard top bar, which adds Logout there.
- The landing page says that AI writes the questions.
- Both READMEs are rewritten for the current product: features, setup, a full table of environment variables, the main API endpoints, pages and code layout.
- Packages: `npm audit fix` updated packages within their allowed versions (including axios with a high-severity fix, and Next.js 16.0 → 16.4.3).

### Removed
- Dead code: `Navbar.tsx`, the empty `middleware.ts`, six unused UI components (alert-dialog, dialog, form, pagination, select, textarea), the unused Tailwind v4 PostCSS config, the default Next.js SVGs, `backend/app/Start-Commands`, the `/hello` and `/test-db` endpoints, the duplicate `__main__` block, `require_self_or_admin` and `TokenData`.
- Unused packages: `@hookform/resolvers`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-dialog`, `@radix-ui/react-select`, `@shadcn/ui`, `css`, `react-hook-form`, `zod`, `@tailwindcss/postcss`, `@types/tailwindcss` and, on the backend, `passlib`.

### Verified
- `npm run lint` reports 0 problems (it had 33), and the type-check and production build pass.
- In Chrome emulating a 390 px phone: landing, login, sign-up, candidate entry, the test screen, My Tests, Create Test, View, Results, result detail and the dashboard. None scroll sideways, and every one has the right tab title. The sample test and candidate used for this were deleted afterwards.
- On a throwaway database:
  - `/health`; CORS for configured, local and unknown origins;
  - login with a hash created by passlib and with a new one (including a non-ASCII password);
  - the 11th login and the 6th sign-up being blocked, with the client IP taken from the proxy header;
  - no SQL or bcrypt warnings in the log.

### Known, deferred
- `npm audit` still lists one moderate issue in `postcss-selector-parser`, a build-time tool with no fix available yet; it doesn't run in the browser.
- The "waking up the server" notice was checked in code but not seen live, since the local backend never sleeps. It will show on the free hosting in Phase 5.

---

## Phase 3: AI generation (Code completed 2026-10-25, quality check waits for the AI key)

### Added
- **Provider choice:** Google **Gemini** (`gemini-3.8-flash`, the model Google recommends for new projects) is the default. It's called through Gemini's OpenAI-compatible endpoint, so **Groq** and **OpenRouter** (or any OpenAI-compatible service via `AI_BASE_URL`) work by changing `AI_PROVIDER` / `AI_MODEL` / `AI_API_KEY` in `backend/.env`. No new Python dependency: the client uses the standard library.
- **AI generator** (`backend/app/ai/`), used automatically once `AI_API_KEY` is set (until then tests still come from the example bank):
  - **Prompt** (`prompt.py`): an expert assessment-writer role, the global rules (exactly 4 options and one answer, believable wrong options, no "all/none of the above", no trick wording, self-contained questions, code in fenced blocks, explanation of at most 25 words), the exact count table, each subject's scope with the rubric for each requested difficulty, and 1–2 example questions per (subject, difficulty) from the bank as style guides.
  - **JSON output:** the request asks for JSON mode (`AI_RESPONSE_FORMAT=json_object`) and spells out the exact shape; replies wrapped in a ```json fence or extra text are also accepted.
  - **Checks** (`parsing.py`): subject and difficulty must match a requested cell; options must be exactly A–D, not empty, not duplicated and not "all/none of the above"; the answer must be A–D; long explanations are trimmed. Near-duplicate questions are dropped, extra questions beyond a cell's count are ignored, and the correct answers are re-positioned so A–D are used about equally (wrong options are shuffled).
  - **Splitting large tests:** the blueprint is split into requests of at most 20 questions (`AI_QUESTIONS_PER_CALL`), grouped by subject, run up to 3 at a time (`AI_MAX_PARALLEL_CALLS`) and merged. It's still one click.
  - **One follow-up round** asks again for just the cells that came back short, listing the questions already written so they aren't repeated.
  - **Time limit** of 90 seconds per request (`AI_TIMEOUT_SECONDS`), enforced for the whole round as well.
- **Daily quotas:** a new `generation_log` table records every generation (source, status, requested and generated counts, provider, model, number of requests, duration, error details).
  - Per creator: `AI_DAILY_LIMIT_PER_USER` (default 5) successful AI tests per day. Failed attempts don't count against it. Admin has no per-creator limit.
  - Global: `AI_DAILY_LIMIT_GLOBAL` (default 50) AI attempts per day for everyone, counting failures, since they use the provider's quota too.
  - Limits reset at 00:00 UTC. When one is reached, the creator gets a 429 with the reason and the reset time (also shown in their local time).
- **`GET /tests/generation-quota`:** whether AI is switched on, and how many AI tests the creator has left today.
- **Create Test page:** a banner shows how many AI tests are left today (or that AI isn't switched on yet), Generate is disabled once the limit is reached, and while generating it says "this can take up to a minute". Quota and AI error messages are shown inline.
- **Database migration** `e8a3c5d17b42`: creates `generation_log`, with a working downgrade.

### Changed
- **Failures are clean:** nothing is saved when generation fails. A wrong key, rate limit, outage, timeout or unusable reply gives a short, specific message, and details go to `generation_log`. When no request succeeds, it stops instead of retrying, so it doesn't use more quota or double the wait. An AI test is only saved if at least half of the requested questions came back; otherwise the creator is asked to try again.
- The ready screen's shortfall note says whether the AI or the bank ran short.
- Explanations written by the AI appear on the View page and in result details (already supported in Phase 2).

### Verified
- With a local fake OpenAI-compatible server standing in for the provider:
  - exact counts per (subject, difficulty) for a 45-question test over 3 requests, with answers spread 12/11/11/11 across A–D and each correct answer moved with its text;
  - fenced JSON replies; invalid items rejected (answer "E", "All of the above", unknown subject);
  - the follow-up round filling short cells; duplicates dropped and the test refused;
  - unusable JSON, wrong key (401), rate limit (429) and a slow provider (timeout), each with one request and nothing saved;
  - the per-creator limit, the global limit and Admin's exemption; the bank fallback with no key.
- The migration up, down and up on a throwaway database; the local development database is migrated and seeded.

### Waiting for the AI key
- The plan's quality check (real tests for every subject and difficulty, read for correct answers, difficulty fit and duplicates, then rubric and prompt tuning) needs a real key. Put it in `backend/.env` as `AI_API_KEY` and restart the backend. Check your project's free-tier limits in Google AI Studio and set `AI_DAILY_LIMIT_GLOBAL` to fit them.
- Note on Gemini's free tier: Google may use prompts and responses to improve its products. The prompts contain only subjects, rubrics and example questions, with no candidate data.

---

## Plan change: all code first, local database until deployment (2026-10-25)
- All code phases (1–4) are finished before any hosted database or hosting is set up; Phase 5 is the only online step.
- Until then the app runs on a local PostgreSQL instance just for this project (port 5433, data in `%LOCALAPPDATA%\EvaluatorAI\pgdata`), separate from the PostgreSQL service already installed. It has been migrated to the latest schema and seeded. Its connection details are only in `backend/.env`; the start command is in the README and in section 7 of the plan.

---

## Phase 2: Test model, timers and candidate flow (Completed 2026-10-25)

### Added
- **Generate a test:** `POST /tests/generate` takes a name, subjects, difficulties, number of questions (5–100), duration (5–180 minutes) and link validity (1–720 hours, or a custom date up to a year ahead). Subjects must be active, and there must be at least one question per subject.
- **Question blueprint** (`backend/app/generation.py`): the exact number of questions per (subject, difficulty). Questions are split evenly across subjects, then across difficulties. Leftover difficulty slots rotate from subject to subject so the overall mix stays balanced.
- **Generator interface** with a **bank generator** that picks random example questions per cell. When the bank is short it uses what it has, and the creator sees which subject/difficulty fell short (the starter bank has 2 per cell). The AI generator plugs in here in Phase 3.
- **New question snapshot:** each test question has its own id, subject, difficulty, options A–D, answer and an (empty for now) explanation.
- **Remove a question:** `DELETE /tests/{id}/questions/{question_id}` (owner or Admin). Returns 409 once any candidate has started; a test keeps at least one question.
- **Candidate API** (`/public/...`, no login): test info, start (or resume) by name and email, resume by attempt token, auto-save answers, submit. One attempt per email per test, enforced by a database constraint.
- **Server-enforced timers** (`backend/app/attempts.py`):
  - Test duration: the deadline is set when the server confirms the start. Answers are rejected after the deadline; submit is accepted for 15 seconds more for slow networks, and after that the attempt closes as timed out with its saved answers.
  - Link validity: an expired link blocks new starts, but anyone already mid-test can resume and finish.
  - Expired attempts are finalised lazily whenever an attempt or a results list is read (no background workers on free hosting).
- **Create Test page** (`/tests/new`): grouped subject chips with "Select all" per group, difficulty checkboxes, duration, a question count that follows the duration until edited, and validity presets (1 / 3 / 7 days or a custom date and time). Generate shows a progress state, then the link with Share and View buttons, plus a warning if the bank was short.
- **View page** (`/tests/{code}`): link and test details, every question with subject, difficulty, options, the correct answer highlighted and the explanation, and a Remove button with confirmation that is disabled with a note once a candidate has started.
- **Candidate pages:**
  - Entry screen with test name, subjects, number of questions, duration, expiry note and the rules. Separate screens for an invalid link, an expired link (with "Already started? Continue with your email") and an already-taken test.
  - Test screen with a countdown computed from the server deadline using the browser's monotonic clock, so changing the computer clock has no effect. It re-syncs when the tab becomes visible again, warns at 5 minutes and 1 minute, and auto-submits at 0.
  - Each answer is saved automatically (one request at a time, retried on network errors, with a Saved / Not saved indicator). A refresh resumes at the first unanswered question with the correct time left. Answers can be cleared.
  - Unanswered questions are allowed; the review screen shows how many and the time left.
  - Code blocks in questions and options are shown in monospace with their indentation kept; `inline code` is formatted too.
  - Phone layout: compact question strip instead of the side navigator, smaller paddings.
- **Results:** status (Submitted / Timed out / In progress), unanswered count and time used in the list and detail pages. The list can be filtered by test (`/results?test=CODE`), linked from My Tests and the View page. The detail page marks unanswered questions and shows explanations.
- **Database migration** `d41f8c2b7a90`: adds the test settings, turns responses into attempts (token, status, start, deadline, submit time, answers as `{question id: option}`), converts existing tests and results to the new format, and has a working downgrade.

### Changed
- **My Tests** shows subjects, questions, duration, Active/Expired status with time left, attempts, and the actions Share, View, Results and Delete. Newest first.
- **Scoring** is calculated from the test snapshot and the saved answers; unanswered questions count as wrong.
- **Finished screen** no longer claims a confirmation email was sent. It says whether the test was submitted or timed out and how many questions were answered.
- Validation errors for numbers, choices and dates now give the real reason (e.g. "num_questions must be at least 5").
- Existing data during the migration:
  - Existing tests get a duration of 30 minutes (or one minute per question if more, up to 180) and a link valid for 7 days from the migration.
  - Existing results become submitted attempts. If a candidate had submitted the same test more than once, only the first submission is kept.

### Removed
- The manual test builder (`TestBuilder.tsx`) and `POST /tests/create`.
- `GET /candidates/test/{code}`, `POST /candidates/submit` and the "every question must be answered" rule.
- `responses.time_taken` and `responses.answered_at` (replaced by `started_at` / `submitted_at`; time used is calculated).

### Known, deferred
- Until Phase 3, most tests come out shorter than requested, because the starter bank has only 2 questions per subject and difficulty.
- An attempt can be resumed on another device by entering the same email on the test link. This is intended (candidates have no login), but anyone who knows a candidate's email and the link could continue their test.
- Lint: the new pages follow the existing `catch (err: any)` pattern; this and the older warnings are left for Phase 4.

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
