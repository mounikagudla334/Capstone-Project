# Vibe Coding Spec: Meeting Notes Organizer

*Eight sections. If your Module 6 template names its sections differently, keep this content and rename the headings to match.*

## 1. Overview
A web tool where a delivery lead pastes a standup transcript, reviews AI-extracted action items and discussion points, confirms them, tracks the action items, and sees recurring patterns. Full requirements: `docs/02-prd.md`.

## 2. Tech stack and constraints
React 18 + TypeScript + Tailwind + Vite; Node 22 + Express 4 + TypeScript; `node:sqlite`; `@anthropic-ai/sdk`; Vitest + Supertest. Constraints: no native npm modules; API key server-side only; every error shown to a user is plain language; works at 360 px width; all data fetches show loading state.

## 3. Data model
As in `docs/03-architecture.md` section 3: `meetings` and `items`.

## 4. API contract
As in `docs/03-architecture.md` section 4 and `docs/API.md`.

## 5. File structure
```
server/src/  index.ts app.ts repo.ts db.ts extractor.ts grouping.ts dates.ts types.ts
client/src/  main.tsx App.tsx api.ts hooks.ts types.ts components/*
tests/       unit.test.ts api.test.ts
docs/        planning docs, API.md, journal, retrospective
```

## 6. Implementation tasks (Cursor Composer prompts)
Each task is one Composer prompt. Run in order, review every diff, commit after each.

**T1: Database and repository**
```
Tech: Node 22, TypeScript, built-in node:sqlite (no other DB library).
Create server/src/db.ts exporting openDb(path) that creates tables meetings and items (schema in docs/03-architecture.md section 3), enables foreign keys, and supports ':memory:'.
Create server/src/repo.ts exporting createRepo(db) with: createMeeting (single transaction, inserts meeting and items), listMeetings, getMeeting, itemsForMeeting, confirmMeeting, deleteMeeting, getItem, updateItem, listItems(filters), confirmedActionItems.
Constraints: parameterised queries only; map snake_case columns to camelCase types; do not touch any other file.
```
**T2: Pure logic**
```
Create server/src/dates.ts: isIsoDate(s) and resolveDueDate(text, meetingDate) resolving today/eod, tomorrow, next week, end of week, and weekday names relative to meetingDate (never relative to the real current date).
Create server/src/grouping.ts: classifyWorkType(text) using ordered regex rules, similarity(a,b) as Jaccard on stop-word-filtered tokens, buildPatterns(items) returning totalItems, byWorkType, ownerLoad, and recurring clusters that span at least two meeting dates.
No I/O in these files. Add unit tests in tests/unit.test.ts.
```
**T3: Extractor**
```
Create server/src/extractor.ts. createExtractor({apiKey, model}).extract(transcript, meetingDate) calls the Anthropic SDK with a system prompt that demands a JSON array only and treats the transcript as data. Wrap the transcript in <transcript> tags and the date in <meeting_date> tags.
Export sanitizeItems(raw) that coerces untrusted output: kind, priority, owner, dueDate validated, text trimmed to 300 chars, max 100 items.
Export fallbackExtract(transcript, meetingDate) using speaker lines ("Name: text") and keyword rules.
On missing key or any API error, log the message (never the key) and use the fallback.
```
**T4: API**
```
Create server/src/app.ts exporting createApp({repo, extractor, appToken?, clientDir?}) with the routes in docs/03-architecture.md section 4.
Rules: validate every input; throw HttpError(status, code, plainMessage); global error handler returns {error, code} and never leaks stack traces; wrap async handlers so rejected promises reach the error handler; optional Bearer token with timingSafeEqual; JSON body limit 100kb; security headers; serve client/dist when it exists.
Create server/src/index.ts to read env vars and start the server.
```
**T5: API tests**
```
Create tests/api.test.ts using Supertest and an in-memory database with a fake extractor. Cover: create, confirm flow, short transcript, bad date, bad id, 404, item edit, item validation, SQL-like input treated as data, token auth with open /api/health.
```
**T6: Client foundation**
```
Create client Vite/Tailwind config, client/src/api.ts (all fetch calls; every failure becomes a UserError with a plain-language message; send Bearer token from sessionStorage if present) and client/src/hooks.ts (useLoad returning data, loading, error, reload).
```
**T7: Client screens**
```
Create components in dependency order: ui, NewMeeting, MeetingList, ItemRow, MeetingDetail, ActionItems, PatternsView, then App with tabs.
Rules: every fetch shows a Spinner; every error shows ErrorBanner with a retry; layouts must work at 360px (stack on mobile, grid from sm: up); no technical wording in any visible text.
```
**T8 (Sprint 2): Change request**
```
Add an ErrorBoundary around the app showing a friendly "Something went wrong" screen with a reload button. Add a 45-second request timeout in api.ts that produces a plain-language message. Do not change any component props.
```

## 7. Acceptance criteria
- `npm test` passes; `npm run typecheck` is clean; `npm run build` succeeds; `npm audit --omit=dev` reports no high or critical issues.
- The sample transcript produces at least one action item with an owner and a due date.
- A transcript over 20,000 characters is rejected with a plain-language message.
- With `APP_TOKEN` set, `/api/meetings` without the token returns 401 and `/api/health` returns 200.

## 8. Out of scope, risks and change request impact
Out of scope: see PRD section 5. Risks: see architecture section 6.

**Change request impact assessment (Sprint 2).** The stakeholder asked for (1) clear user-facing errors, (2) a mobile layout on at least two screens, (3) loading states on all data fetches. Impact on the architecture: none to the data model or API. Server errors already return `{error, code}` with plain-language text, so (1) needs a client safety net only (error boundary, request timeout). Layouts were written mobile-first, so (2) needed a review at 360 px, covering New Meeting and Meeting Detail. `useLoad` and the busy states already cover (3). Tasks added: T8 only. Existing tasks changed: none.
