# Meeting Notes Organizer

Paste a daily standup transcript and get structured notes: action items with owner, priority, due date and work type, plus discussion points. Review and correct them, confirm, then track the action items and see which work types and which items keep recurring across meetings.

Built for the *Vibe Coding with Claude + Cursor* capstone (Option A: AI-powered internal business tool).

## Features
- **Extract:** Claude turns a transcript into structured items. If no API key is set, or the API fails, a rule-based fallback runs and the meeting is labelled as such.
- **Review and confirm:** every meeting starts as a draft; edit any field, then confirm. Only confirmed items count.
- **Track:** confirmed action items sorted by due date, filter by priority and status, overdue count, mark done.
- **Patterns:** counts by work type, items that recur across meeting dates, open and high-priority work per person.
- **Optional access token** to protect a public deployment.

## Requirements
Node.js 22.5 or newer (the app uses Node's built-in `node:sqlite`).

## Quick start
```bash
npm install
cp .env.example .env        # then edit .env
npm run build               # builds the client into client/dist
npm start                   # http://localhost:3000
```
For development with hot reload, run `npm run dev:server` and `npm run dev:client` in two terminals and open http://localhost:5173.

The app works without an API key (rule-based extraction). Add `ANTHROPIC_API_KEY` for Claude extraction.

## Environment variables
| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | No (but needed for AI extraction) | Claude API key from console.anthropic.com. Server-side only. Never commit it. |
| `APP_TOKEN` | No | If set, every `/api` route except `/api/health` needs `Authorization: Bearer <token>`. Recommended for any public URL. |
| `PORT` | No (default 3000) | HTTP port. Hosts such as Railway set this for you. |
| `DB_PATH` | No (default `./data/notes.db`) | Where the SQLite file lives. Point it at a mounted volume in production. |
| `CLAUDE_MODEL` | No (default `claude-sonnet-4-20250514`) | Model used for extraction. |

## Scripts
| Command | What it does |
|---|---|
| `npm test` | Runs 17 unit and API tests (in-memory database, no network). |
| `npm run typecheck` | TypeScript check for server, client and tests. |
| `npm run build` | Builds the client. |
| `npm start` | Runs the server (and serves the built client). |

## Deployment (Railway, one service)
1. Push this repo to GitHub.
2. In Railway: **New Project, Deploy from GitHub repo**, pick this repo.
3. **Variables:** set `ANTHROPIC_API_KEY`, `APP_TOKEN`, `NIXPACKS_NODE_VERSION=22`, and `DB_PATH=/data/notes.db`.
4. **Volume:** add a volume mounted at `/data` so the database survives redeploys. Without a volume, data resets every deploy.
5. **Settings:** build command `npm install && npm run build`, start command `npm start`.
6. **Networking:** generate a public domain. Open `https://<domain>/api/health`; it should return `{"ok":true}`.
7. Smoke test: open the site, paste the sample transcript, confirm, check Action items and Patterns.

## Project structure
```
server/src/   Express API, SQLite repository, extractor, grouping, date helpers
client/src/   React app (components, API client, loading hook)
tests/        unit and API tests
docs/         planning documents, API reference, debugging journal, retrospective
```

## Privacy note
Transcripts are stored on your own server so you can re-check an extraction, and can be deleted per meeting. When Claude extraction is on, transcript text is sent to the Anthropic API. Do not paste anything your organisation does not allow you to send to an external AI service.

## Documentation
`docs/01-idea-brief.md`, `02-prd.md`, `03-architecture.md`, `04-spec.md`, `05-prompt-library.md`, `API.md`, `10-debugging-journal.md`, `11-retrospective.md`, `12-self-assessment.md`.
