# EvaluatorAI: Project Plan

This file is the single source of truth for turning the platform into a free, public, AI-powered test generator. It is built **one phase at a time**.

---

## 0. Working rules (read first)

1. **One phase at a time.** Work is split into the phases below. Nothing from a later phase is built early.
2. **"Implement" means one phase only.** When the owner says *implement*, only the next pending phase is built. Work then **stops** and is handed over for review. The next phase starts only on the next *implement* instruction.
3. **Verify while building and after.** Each phase is checked as it is built and again at the end, by hand: running the backend against a real PostgreSQL database, calling the endpoints, building the frontend, and walking through every changed code path. **No automated test-script files** are added for this.
4. **Every phase ends with a manual checklist** for the owner to click through in the browser.
5. **Git.** Each phase is coded on its own branch (`phase-N-short-name`) and **left uncommitted in the working tree** for the owner to review. Nothing is committed or pushed until the owner says so; then the phase is committed with a detailed message (see rule 9), with no AI attribution lines, and pushed.
6. **External accounts are requested only when needed.** The AI API key is requested at the start of Phase 3. Hosting accounts (Neon, Render, Vercel) are requested at the start of Phase 5.
7. **Progress lives in `CHANGELOG.md`.** At the end of every phase, the phase is marked Completed there with a full list of what changed.
8. **Resuming work:** at the start of every session, `CHANGELOG.md` is checked first, and work continues from the first phase not marked Completed.
9. **Commit messages** never mention phases. Each one describes in detail the functionality it adds or changes.

---

## 1. Product summary

### Test creator (the main user)
- Signs up with **name, email and password**, then logs in.
- Creates a test by choosing:
  - **Subjects:** one or more from a fixed list of 24 (section 4)
  - **Difficulty:** Easy, Medium, Hard, or any mix (at least one)
  - **Number of questions:** defaults to about one per minute of duration
  - **Test duration:** how long a candidate has once they start
  - **Link validity:** how long the link accepts new candidates
- One click, and **AI generates the questions**. The test is saved with a shareable link.
- **View:** each question with its subject, difficulty, options, correct answer and a short explanation. The creator can **remove** questions. Removing is locked once the first candidate has started.
- **Share:** copy the candidate link.
- **Results:** score and per-question breakdown for each candidate. A creator only ever sees their own tests and results.

### Candidate
- Opens the link, enters name and email, and the **timer starts**.
- Answers multiple-choice questions. Progress is saved automatically, and a refresh **resumes** the test with the time remaining.
- When time runs out the test **submits automatically**. Unanswered questions count as wrong.
- **One attempt per email per test.**

### The two timers
| Timer | Applies to | When it ends |
|---|---|---|
| Test duration | Each candidate's attempt, from the moment they press Start | That attempt is auto-submitted |
| Link validity | The test link as a whole | New candidates can't start. Anyone mid-test can still finish |

Both are enforced **on the server**. The browser only displays them.

### Admin (the platform owner only)
- Manages the **example question bank**, which the AI uses as style examples.
- Can see all tests and results.
- There is no public way to become Admin. Admin accounts come from `seed.py` only.

---

## 2. Constraints: zero running cost

| Need | Service (free tier) | Limits that shape the design |
|---|---|---|
| Database | **Neon** PostgreSQL | Small storage, compute sleeps when idle (first query after idle is slower) |
| Backend | **Render** free web service | Sleeps after ~15 min idle, about a minute to wake. **No background workers or cron**, so all timeouts are handled lazily on request |
| Frontend | **Vercel** Hobby | Meant for non-commercial use (fine while the product is free) |
| AI | A free-tier LLM API (chosen at Phase 3) | Requests per minute and per day are limited, so daily generation quotas are needed |

Free-tier terms change. They are re-checked at the start of Phase 3 (AI) and Phase 5 (hosting).

Design consequences:
- The candidate timer starts only after the server confirms the start, so a slow wake-up never uses up a candidate's time.
- Expired attempts are finalised when someone next reads them, not by a scheduler.
- AI generation has per-creator and global daily caps to protect the free quota.

---

## 3. Key decisions (agreed)

| Topic | Decision |
|---|---|
| Sign-up | Email + password. No email verification or password reset in v1 (planned for later) |
| Subjects | Fixed list, no free text. Broad subjects plus dedicated ones (e.g. **Databases** and **SQL**) |
| Difficulty style | Technical subjects: Easy = theory, Medium/Hard = technical (code, queries, debugging). Aptitude/English: difficulty = complexity |
| Question count | Creator chooses; default about one question per minute of duration |
| Editing a generated test | Remove questions only. Locked once any candidate has started |
| View page | Question, subject, difficulty, options, correct answer, short explanation |
| Example question bank | Used as AI style examples for matching subjects. Managed by Admin |
| Attempts | One per email per test. Refresh resumes. Auto-submit at time-out |
| Link expiry | Blocks new starts only |
| AI calls | One click per test. The backend may split a very large test into a few calls behind the scenes |
| Explanation field | Yes, one short line per AI question (default; owner can say no) |

---

## 4. Subject catalogue

24 subjects in 8 groups. Each subject stores a **topic scope** and a rubric for **what Easy, Medium and Hard mean** for that subject. These rubrics go straight into the AI prompt, so editing them tunes question quality. They live in `backend/app/data/subjects.py`, and re-running `seed.py` updates them.

| Group | Subjects |
|---|---|
| Aptitude | Logical Reasoning, Quantitative Aptitude, English Comprehension |
| CS Fundamentals | Computer Science Fundamentals, Data Structures & Algorithms, Object-Oriented Programming, Operating Systems, Computer Networks |
| Programming Languages | Python, JavaScript, TypeScript, Java |
| Frontend | HTML, CSS, React, React Hooks |
| Backend | Node.js & Express, REST APIs |
| Databases | Databases (general: SQL, PostgreSQL, MongoDB, design), SQL, MongoDB |
| AI / ML | Machine Learning, Deep Learning |
| Tools | Git |

**Difficulty rules**
- **Technical subjects**
  - Easy = theory: definitions, concepts, "what is / why".
  - Medium = applied: reading code or queries and predicting the output, picking the right construct.
  - Hard = debugging, edge cases, performance and trade-offs, usually with a code snippet.
- **Aptitude and English**
  - Easy = single-step problems and short passages.
  - Medium = two to three steps, moderate passages.
  - Hard = multi-step puzzles, long passages that need inference.

---

## 5. Target data model (end of Phase 3)

| Table | Purpose | Key fields |
|---|---|---|
| `roles` | Admin / Creator | `role_name` |
| `users` | Creators and admins | `name`, `email` (stored lowercase, unique), `password` (bcrypt), `role_id` |
| `subjects` | Fixed catalogue | `slug`, `name`, `group_name`, `scope`, `easy_rubric`, `medium_rubric`, `hard_rubric`, `sort_order`, `is_active` |
| `questions` | Example bank (Admin) | `subject_id`, `question_text`, `options` (A–D), `correct_option`, `difficulty`, `user_id` |
| `tests` | A generated test | `test_name`, `test_code`, `user_id`, `subject_ids`, `difficulties`, `num_questions`, `duration_minutes`, `expires_at`, `questions_data` (snapshot: subject, difficulty, question, options, answer, explanation) |
| `candidates` | People who took tests | `name`, `email` |
| `responses` (attempts) | One attempt | `test_id`, `candidate_id`, `attempt_token`, `started_at`, `deadline`, `submitted_at`, `status` (`in_progress` / `submitted` / `timed_out`), `answers` (saved as they go), `score`. Unique per (test, candidate) |
| `generation_log` | AI usage for quotas | `user_id`, `created_at`, `status`, `question_count` |

The old `categories` table is replaced by `subjects` in Phase 1.

---

## 6. Phases

Each phase lists: goal, backend work, frontend work, data changes, what is out of scope, when it counts as done, and how it is verified.

### Phase 1: Accounts and subjects

**Goal:** anyone can sign up as a test creator, the subject catalogue exists, and the example question bank is organised by subject. The app keeps working end to end, still using the existing manual test builder.

**Backend**
- **Sign-up:** `POST /auth/signup` (name, email, password) always creates a **Creator** and logs them straight in (returns a token).
  - Validation: name required (max 150 characters), valid email, password 8–72 characters (bcrypt's limit).
  - Emails are stored and looked up in lowercase.
- **Login:** a wrong email and a wrong password give the same message ("Invalid email or password"), so the form doesn't reveal which emails are registered.
- **Close the Admin hole:** `POST /users/` becomes Admin-only.
- **Subjects:** new `subjects` table, filled from `subjects.py` by an idempotent seed that updates rubrics on re-run. New `GET /subjects` endpoint (any logged-in user) returns subjects in catalogue order with group and example-question count.
- **Subjects replace categories:**
  - Questions get `subject_id`. The migration maps existing questions to subjects by name (Python → Python, SQL → SQL, and so on). Questions with no match stay **Unassigned**, so the Admin can reassign them; nothing is deleted.
  - The `categories` table, its routes and `category_id` are removed.
  - Question endpoints use `subject_id` and filters `subject_id`, `group`, `difficulty`, `search`. The unused `GET /tests/questions` endpoint is removed.
- **Starter example bank:** `backend/app/data/example_questions.py` holds 2 questions per subject per difficulty (144 total). Each has 4 options and one correct answer, written so Easy is theory and Medium/Hard is technical. The seed adds any that are missing; it never duplicates.
- **Ownership, needed now that anyone can sign up:**
  - Creators see only results for **their own** tests (`GET /candidates/results`, `GET /candidates/result/{id}`) and only their own test details (`GET /tests/{code}`). Admin sees everything.
  - A creator can delete results of their own tests.
- **Migration:** one new Alembic revision. It creates `subjects`, adds `questions.subject_id`, maps the data, and drops `category_id` and `categories`. It has a working downgrade.

**Frontend**
- **Landing page** at `/` for visitors who aren't logged in: what the product does, how it works in 3 steps, and Sign up / Log in buttons. Logged-in users see the dashboard at `/`.
- **Sign-up page** `/signup`: name, email, password, confirm password. Errors are shown inline. On success the creator is logged in and lands on the dashboard.
- **Login page:** link to sign up.
- **Role-based navigation:**
  - **Creator:** Dashboard, Tests, Results.
  - **Admin:** Dashboard, Subjects, Questions, Tests, Results.
  - If the saved user is missing (an older login), it is fetched from `/auth/me`.
  - Admin-only pages redirect Creators to the dashboard.
- **Header:** shows the logged-in user's name and role.
- **Subjects page** (Admin, read-only) replaces Categories: subjects by group with example-question counts. Expanding a subject shows its scope and Easy/Medium/Hard rubrics.
- **Questions page** (Admin):
  - Filters are Group → Subject → Difficulty, plus search.
  - The add/edit form picks a **Subject** (grouped dropdown). Unassigned questions are marked and must get a subject when saved.
  - CSV import columns: `question_text, subject, difficulty, option_a … option_d, correct_answer`. The subject is matched by name, ignoring case. The template has a valid sample row.
- **Manual test builder** (still used until Phase 2): groups questions by Group → Subject.
- **Results:** Delete is shown to owners. The list already contains only their tests.
- **Branding:** "EvaluatorAI" everywhere (renamed from "Candidate Evaluation Platform").

**Out of scope:** new test form, timers, AI, deployment.

**Done when**
- A new person can sign up, gets the Creator role, and can create a test with the manual builder, share it, and see only their own results.
- Admin sees Subjects and Questions. A Creator can't open them, from the menu or by typing the URL.
- `alembic upgrade head` and `seed.py` work on an empty database **and** on a Phase-0 database with categories and questions. Re-running the seed changes nothing.
- The frontend builds with no type errors.

**Verification:** a throwaway local PostgreSQL instance; migrate both an empty database and a Phase-0 database containing categories and questions. Call every changed endpoint as Admin, Creator and a second Creator (to check ownership). Build the frontend and walk through each changed page's code. Proof-read the starter questions for correct answers.

**Implementation notes (added after Phase 1 was built)**
- The catalogue and starter bank are Python files (`subjects.py`, `example_questions.py`) rather than JSON, so code snippets inside questions stay readable.
- The app no longer creates tables on startup (`create_all` removed). The schema comes only from `alembic upgrade head`, which avoids the old "run migrations before the first start" trap.
- Validation errors now give the real reason (e.g. "password must be at least 8 characters", "Please enter a valid email address") instead of always "cannot be empty".
- The seed rotates the correct answer's position, so the 144 starter questions are split evenly at 36 per letter (A–D).
- The CSV import reports which rows failed and why.
- Known and deferred to Phase 4: lint warnings that already existed across the frontend (`any` types, the "mounted" pattern), and a harmless passlib warning about reading the bcrypt version.
- Code snippets in questions show as plain text until Phase 2 adds code formatting.

---

### Phase 2: New test model, both timers and the candidate flow (questions still from the bank)

**Goal:** the whole new product works end to end. "Generate" temporarily picks random matching questions from the example bank, so everything can be tested before any AI key exists.

**Backend**
- **Test fields:** `subject_ids`, `difficulties`, `num_questions`, `duration_minutes`, `expires_at`. The question snapshot gets `subject`, `difficulty` and an empty `explanation`.
- **Question blueprint:** the backend works out exactly how many questions each (subject, difficulty) gets. N is split evenly across subjects, then each subject's share evenly across the chosen difficulties, with leftovers going to the first ones.
- **Generator interface** `generate(blueprint) → questions`. Phase 2 implements a **bank generator**; Phase 3 adds the AI one. If the bank is short for a cell, it returns what it has and says so.
- **`POST /tests/generate`:**
  - Validation: at least one subject and one difficulty; 5–100 questions; duration 5–180 minutes; validity 1 hour – 30 days, or a custom date in the future.
  - It also validates that the subjects are active.
- **`DELETE /tests/{id}/questions/{question_id}`** for owner or Admin. It returns **409 Conflict** once any attempt exists.
- **Candidate API** (public, keyed by the test code and a random attempt token):
  - `GET /public/tests/{code}`: name, subjects, number of questions, duration, expiry, and whether it has expired. No questions.
  - `POST /public/tests/{code}/start` with name and email:
    - Rejected if the link has expired or this email has already **submitted**.
    - If this email has an attempt **in progress**, it is resumed.
    - Otherwise it creates the attempt (`started_at`, `deadline = started_at + duration`) and returns the token, the questions without answers, the deadline and the server's current time.
  - `GET /public/attempts/{token}`: resume. Returns the questions, saved answers, deadline and server time.
  - `PUT /public/attempts/{token}/answers`: saves answers. Rejected after the deadline.
  - `POST /public/attempts/{token}/submit`: accepted until the deadline plus 15 seconds of grace for slow networks. After that the attempt is finalised as `timed_out` using its saved answers.
  - **Lazy finalising:** whenever an attempt or results list is read, any attempt past its deadline is scored and closed.
- **Results:** status (submitted / timed out), unanswered count, time used.
- The old `/candidates/test` and `/candidates/submit` endpoints and the "every question must be answered" rule are removed.

**Frontend**
- **Create Test page:**
  - Test name.
  - Subjects as grouped chips (multi-select) and difficulty checkboxes (at least one).
  - Number of questions, defaulting to the duration and recalculated until the creator edits it.
  - Duration and link validity (1 day / 3 days / 7 days / custom date and time).
  - The **Generate** button shows a progress state.
- **My Tests:** name, subjects, questions, duration, status (**Active** / **Expired**, with time left), attempts, and the actions **Share** (copy link), **View** and **Results**, plus delete.
- **View page:**
  - Each question with subject, difficulty, options, the correct answer highlighted and the explanation.
  - **Remove** button with a confirmation. It is disabled with a note once candidates have started.
- **Candidate pages:**
  - **Entry:** test name, subjects, number of questions, duration and an "expires on" note. Clear screens for invalid link, expired link and already attempted.
  - **Test screen:**
    - A **countdown** based on the server deadline, so changing the computer clock doesn't help. Warnings at 5 minutes and 1 minute.
    - Each answer is auto-saved. Refresh resumes. At 0 the test auto-submits.
    - Unanswered questions are allowed; the review screen shows how many.
    - Code blocks in questions are shown in monospace with indentation kept.
    - The candidate pages work on a phone.
- **Results pages:** status, unanswered count, time used.
- The manual test builder is removed.

**Out of scope:** AI generation, quotas.

**Done when**
- A creator can generate a bank-based test, view it, remove questions, share it, and see results.
- A candidate can start, refresh and resume with the correct remaining time, be auto-submitted at 0, and is blocked from a second attempt.
- An expired link blocks new starts but lets an attempt already in progress finish.
- Removing questions is blocked after the first start.

**Verification:** a throwaway PostgreSQL instance with short durations (e.g. 1 minute) and short validity to watch both timers expire for real. Resume after a simulated refresh. Try submitting after the deadline, a second attempt with the same email, and editing after a start. Build the frontend and walk through the candidate and creator pages.

**Implementation notes (added after Phase 2 was built)**
- Leftover difficulty slots rotate from subject to subject (instead of always going to the first difficulty), so a many-subject test stays balanced across Easy/Medium/Hard.
- The number of questions must be at least the number of subjects, so every chosen subject gets a question.
- A custom link expiry can be up to one year ahead.
- A submit that arrives during the 15-second grace after the deadline (the auto-submit) is accepted with its final answers and recorded as **timed out**; before the deadline it is **submitted**.
- Results also list attempts that are **in progress**, with a live score on the detail page; deleting one lets that candidate start again.
- Once an attempt is finished, the browser forgets its token, so a shared computer doesn't greet the next candidate with "already taken". The server still blocks a second attempt with the same email.
- A test keeps at least one question; removing the last one is refused.
- `responses.time_taken` and `answered_at` are replaced by `started_at` / `submitted_at`. The migration converts old tests and results and keeps only the first submission when a candidate had submitted the same test twice.

---

### Phase 3: AI generation ⚠️ the AI API key is needed here

**Goal:** "Generate" calls a free AI API and builds a high-quality test from the blueprint.

**Before starting:** the current free tiers of the main free LLM APIs are compared (quality, JSON output support, output length, requests per day, data-use terms). A recommendation is made, and **the owner creates the key**. It goes in `backend/.env` as `AI_API_KEY`, with `AI_PROVIDER` and `AI_MODEL`. It never goes in the frontend.

**Backend**
- **Provider client** behind a small interface, so the provider can be switched by changing environment variables.
- **Prompt builder:**
  - The role: an expert assessment writer.
  - Global rules:
    - exactly 4 options (A–D) and one correct answer
    - believable wrong options; no "all/none of the above", no trick wording
    - every question self-contained
    - code in fenced code blocks
    - an explanation of at most 25 words
  - The exact count table from the blueprint.
  - For each requested subject: its scope plus the Easy/Medium/Hard rubric.
  - 1–2 example questions per (subject, difficulty) from the bank, for style.
- **Structured output:** the model must return JSON matching a fixed schema (`questions[]`: subject, difficulty, question, options {A,B,C,D}, answer, explanation), using the provider's JSON mode where available.
- **Checking the output:**
  - Parse the JSON and enforce the schema.
  - The answer must be one of A–D. Options must not be empty or duplicated.
  - Subject and difficulty must match a requested cell.
  - Remove near-duplicate questions.
  - **Shuffle option order** server-side so correct answers are spread across A–D.
  - Missing questions get **one** follow-up call for just those cells.
- **Splitting large tests:** if the requested size goes beyond what the model can reliably return in one reply, the blueprint is split into a few calls (grouped by subject) and merged. It is still one click for the creator.
- **Quotas:** `generation_log` records every generation.
  - Per-creator daily cap (`AI_DAILY_LIMIT_PER_USER`, default 5).
  - Global daily cap (`AI_DAILY_LIMIT_GLOBAL`, set to fit the provider's free tier).
  - When a cap is hit, the creator gets a clear message saying when they can try again.
- **Timeouts:** about 90 seconds on the AI call, with a clean error. Nothing is half-saved on failure.

**Frontend**
- The Generate button shows a "Generating your test… this can take up to a minute" state that blocks double-clicks.
- Quota and error messages.
- Explanations shown on the View page.

**Out of scope:** regenerating a single question, custom subjects.

**Done when:** tests are generated for any mix of subjects and difficulties with exact counts, valid structure, spread-out answer letters and sensible difficulty. Quotas and failures are handled cleanly.

**Verification:** generate real tests through the app for every subject and each difficulty. Read them for correct answers, difficulty fit (Easy = theory, Hard = technical) and duplicates, and tune the rubrics and prompt until quality is consistent. Force failures (bad key, quota reached, malformed reply) to confirm the error paths.

---

### Phase 4: Polish and hardening

- Loading states for AI generation and for the free server waking up (a "waking up the server…" message on the first slow request).
- Empty states, friendly errors, page titles and metadata for the landing page.
- Responsive layout checked on phone widths, especially the candidate pages.
- Basic rate limiting for login and sign-up (per IP, in memory; enough for one free instance).
- Allowed frontend origins (CORS) read from an environment variable (`FRONTEND_URL`) instead of hard-coded.
- Remove dead code and unused dependencies (e.g. the unused `Navbar.tsx`, the empty `middleware.ts`, unused packages).
- Rewrite `README.md` and `frontend/README.md` for the new product.

**Done when:** every page has proper loading, empty and error states, works on a phone, and nothing unused remains.

**Verification:** walk through every page at desktop and phone widths, check behaviour on slow and failed requests, and run a production build.

---

### Phase 5: Free deployment ⚠️ hosting accounts are needed here

**Before starting:** re-check the free-tier terms. The owner creates accounts on **Neon**, **Render** and **Vercel** (GitHub sign-in is easiest) and shares the values needed.

**Steps**
1. **Neon:** create the project and database, and copy the pooled connection string.
2. **Backend on Render:**
   - Update `render.yaml`: remove Render's database (free ones expire), keep `rootDir: backend`.
   - Environment variables: `DATABASE_URL`, `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `AI_*` and `FRONTEND_URL`.
   - Run `alembic upgrade head` and `seed.py` against Neon. Change the seeded Admin password.
3. **Frontend on Vercel:** import the repo, set Root Directory to `frontend` and `NEXT_PUBLIC_API_URL` to the Render URL.
4. Point `FRONTEND_URL` on Render to the Vercel URL.
5. Optional: a free uptime monitor pinging the backend to reduce cold starts.
6. Run the full manual test plan on the live URLs, including a candidate on a phone.

**Done when:** a stranger can sign up on the live site, generate a test, share it, and a candidate on another device can take it, all on free tiers.

---

### Later (after launch, not scheduled)
- Email verification and forgot password (free transactional email service)
- Regenerate a single question
- Custom subjects
- Basic proctoring signals (tab-switch count)
- Export results (CSV/PDF)
- Usage dashboard for the Admin

---

## 7. Verification approach (every phase)

- **Backend:** run against a **throwaway local PostgreSQL instance** started from the installed PostgreSQL binaries, on a separate port with its own temporary data folder, so the owner's own database is never touched. Migrations are run, and endpoints are called by hand as each role.
- **Frontend:** a production build (type-check included), plus a read-through of each changed page's states (loading, empty, error, success).
- **Hand-over:** a written summary of what changed, what was verified, anything not verified, and a browser checklist for the owner.

---

## 8. Open items

| Item | Default if no answer |
|---|---|
| Old question data (from the previous Render DB) | Not available; the starter bank from Phase 1 is used |
| Subject list | The 24 subjects in section 4 |
| Explanation field | Included (Phase 3) |
| Per-creator daily AI limit | 5 tests per day |

---

## 9. Status

Progress is tracked in **[CHANGELOG.md](CHANGELOG.md)**: a status table for every phase, plus a detailed entry for each completed phase.
