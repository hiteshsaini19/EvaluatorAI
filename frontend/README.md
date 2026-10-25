# EvaluatorAI frontend

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS. It talks to the FastAPI backend in `../backend`; see the [root README](../README.md) for the whole project and backend setup.

## Run it

```powershell
npm install
# .env.local
#   NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev      # http://localhost:3000 (keep port 3000: it's the origin the backend allows locally)
npm run build    # production build, includes the type-check
npm run lint
```

## Pages

| Route | Who | What |
|---|---|---|
| `/` | everyone | Landing page when logged out, dashboard when logged in |
| `/login`, `/signup` | everyone | Creator accounts |
| `/tests` | creator | My Tests: status, attempts, Share / View / Results / Delete |
| `/tests/new` | creator | Create Test: subjects, difficulty, size, duration, link validity; AI quota banner |
| `/tests/[code]` | creator | View a test with answers and explanations; remove questions |
| `/results`, `/results/[id]` | creator | Results list (filter with `?test=CODE`) and per-question breakdown |
| `/subjects`, `/questions` | admin | Subject catalogue and the example question bank |
| `/candidate/[code]` | candidate | Entry screen (invalid, expired and already-taken screens included) |
| `/candidate/[code]/start` | candidate | The timed test |

## Where things are

- `src/lib/api.ts`: every API call, the error-message helpers, and the slow-request tracker behind the "waking up the server" notice.
- `src/lib/auth.ts`: token storage plus `useIsLoggedIn`, `useIsClient` and `usePageTitle`.
- `src/lib/candidate.ts`, `src/lib/tests.ts`, `src/lib/subjects.ts`: shared types and formatting.
- `src/components/AppShell.tsx`: sidebar on desktop, slide-in menu on phones, none on public pages.
- `src/components/candidate/`: the candidate test screens.
- `src/components/FormattedText.tsx`: renders ```code blocks``` and `inline code` in questions.
- `src/components/ui/`: the few shadcn/ui primitives in use (button, card, input, label, table).
