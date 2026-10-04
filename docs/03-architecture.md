# Technical Architecture: Meeting Notes Organizer

## 1. Tech stack
| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18, TypeScript, Tailwind, Vite | Matches the course stack; fast build; mobile-first utilities. |
| Backend | Node 22, Express 4, TypeScript (run with tsx) | Small, well understood; no build step for the server. |
| Database | SQLite via built-in `node:sqlite` | No native module to compile (the builder's network blocks the public npm registry), one file, one service. |
| AI | `@anthropic-ai/sdk`, model set by `CLAUDE_MODEL` | Required for the AI feature; model configurable without code changes. |
| Tests | Vitest and Supertest | Fast unit and HTTP-level tests with an in-memory database. |
| Hosting | One Railway service (Express serves the built client) with a volume for the database file | One URL, no CORS, one set of environment variables. |

## 2. Components
**Server (`server/src`)**
- `index.ts`: reads environment variables, wires the pieces together, starts listening.
- `app.ts`: defines HTTP routes, validation, auth and the global error handler.
- `repo.ts`: all SQL in one place; the only module that touches the database.
- `db.ts`: opens SQLite and creates tables if missing.
- `extractor.ts`: turns a transcript into items using Claude, falling back to rules, and sanitises everything the model returns.
- `grouping.ts`: classifies work types and builds recurring-item clusters and counts.
- `dates.ts`: validates ISO dates and resolves relative phrases against the meeting date.
- `types.ts`: shared server types.

**Client (`client/src`)**
- `api.ts`: the only code that calls the server; converts every failure into a message safe to show.
- `hooks.ts`: `useLoad`, giving every screen loading and error state.
- `App.tsx`: tab navigation and the optional access-token box.
- `components/NewMeeting`: paste form with a busy state. `MeetingList`: meetings with status. `MeetingDetail`: review, edit, confirm, delete. `ItemRow`: one item, view or edit. `ActionItems`: confirmed work with filters. `PatternsView`: counts, recurring items, owner load. `ui`: shared spinner, error banner, badges, button styles.

## 3. Data model
**meetings**: `id` (PK), `title`, `meeting_date` (ISO date), `transcript`, `extracted_by` (`claude` or `fallback`), `confirmed` (0/1), `created_at`.

**items**: `id` (PK), `meeting_id` (FK to meetings, delete cascades), `kind` (`action` or `discussion`), `text`, `owner` (nullable), `priority` (`high`/`medium`/`low`), `due_date` (nullable ISO date), `work_type`, `status` (`draft`/`confirmed`/`done`), `created_at`.

Indexes on `items.meeting_id` and `items.status`. One meeting has many items.

## 4. API design
All routes are under `/api`. Errors always return `{ "error": "<plain-language message>", "code": "<MACHINE_CODE>" }`. When `APP_TOKEN` is set, every route except `GET /api/health` needs `Authorization: Bearer <token>`.

| Method | Path | Auth | Request | Success response |
|---|---|---|---|---|
| GET | `/api/health` | none | none | `200 { ok: true }` |
| POST | `/api/meetings` | token if set | `{ transcript, meetingDate?, title? }` | `201 { meeting, items }` |
| GET | `/api/meetings` | token if set | none | `200 Meeting[]` |
| GET | `/api/meetings/:id` | token if set | none | `200 { meeting, items }` |
| POST | `/api/meetings/:id/confirm` | token if set | none | `200 { meeting, items }` |
| DELETE | `/api/meetings/:id` | token if set | none | `204` |
| GET | `/api/items` | token if set | query: `status`, `owner`, `priority`, `kind` | `200 Item[]` |
| PATCH | `/api/items/:id` | token if set | any of `text`, `owner`, `priority`, `dueDate`, `workType`, `status` | `200 Item` |
| GET | `/api/patterns` | token if set | none | `200 { totalItems, byWorkType, ownerLoad, recurring }` |

Full request, response and error detail is in `docs/API.md`.

## 5. Implementation sequence
1. Scaffold, config, types. 2. Database and repository. 3. Pure logic (dates, classification, grouping). 4. Extractor with fallback. 5. API routes and error handler. 6. Tests for 3 to 5. 7. Client config and API client. 8. Screens in dependency order: shared UI, new meeting, list, item row, detail, action list, patterns. 9. Change request (error boundary, request timeout). 10. Docs, security checks, deployment.

## 6. Risks
| Risk | Impact | Mitigation |
|---|---|---|
| Model returns malformed or hostile output | Bad data stored, or an injection attempt | `sanitizeItems` validates every field; the prompt marks the transcript as data, not instructions. |
| Claude API down, slow or key missing | Feature unusable | 30-second timeout, one retry, then rule-based fallback; the meeting records which method was used. |
| `node:sqlite` is still experimental | API may change | Isolated in `db.ts` and `repo.ts`; swapping to another driver touches two files. |
| Database file lost on redeploy | Data loss | Mount a volume and point `DB_PATH` at it; documented in the README. |
| Open deployment exposes meeting content | Privacy | Optional `APP_TOKEN`; recommended for any public URL. |
| Token similarity clusters wrongly | Misleading patterns | Threshold is a parameter; users can edit work types; revisit with real data. |
