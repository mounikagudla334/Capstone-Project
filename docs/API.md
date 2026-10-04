# API Reference

Base path: `/api`. All bodies are JSON. Dates are ISO `YYYY-MM-DD`.

**Auth:** if the server has `APP_TOKEN` set, send `Authorization: Bearer <token>` on every route except `GET /api/health`. Without it: `401 UNAUTHORIZED`.

**Errors:** every error returns `{ "error": "<plain-language message>", "code": "<CODE>" }`.

**Objects**
- `Meeting`: `{ id, title, meetingDate, transcript, extractedBy: "claude"|"fallback", confirmed, createdAt }`
- `Item`: `{ id, meetingId, kind: "action"|"discussion", text, owner|null, priority: "high"|"medium"|"low", dueDate|null, workType, status: "draft"|"confirmed"|"done", createdAt }`

---
## GET /api/health
Auth: none. Response `200 { "ok": true }`.

## POST /api/meetings
Create a meeting and extract its items (all start as `draft`).
- **Auth:** token if configured
- **Request:** `{ "transcript": string (10 to 20,000 chars), "meetingDate"?: "YYYY-MM-DD" (default today), "title"?: string (max 120) }`
- **Response `201`:** `{ "meeting": Meeting, "items": Item[] }`
- **Errors:** `400 TRANSCRIPT_TOO_SHORT`, `413 TRANSCRIPT_TOO_LONG`, `400 BAD_DATE`, `413 PAYLOAD_TOO_LARGE`, `400 BAD_JSON`, `401 UNAUTHORIZED`

## GET /api/meetings
- **Auth:** token if configured. **Response `200`:** `Meeting[]`, newest meeting date first.

## GET /api/meetings/:id
- **Auth:** token if configured. **Response `200`:** `{ "meeting": Meeting, "items": Item[] }`
- **Errors:** `400 BAD_ID`, `404 MEETING_NOT_FOUND`

## POST /api/meetings/:id/confirm
Marks the meeting confirmed and moves its `draft` items to `confirmed`.
- **Auth:** token if configured. **Request:** none. **Response `200`:** `{ "meeting": Meeting, "items": Item[] }`
- **Errors:** `400 BAD_ID`, `404 MEETING_NOT_FOUND`

## DELETE /api/meetings/:id
Deletes the meeting and all its items.
- **Auth:** token if configured. **Response:** `204` no body.
- **Errors:** `400 BAD_ID`, `404 MEETING_NOT_FOUND`

## GET /api/items
- **Auth:** token if configured
- **Query (all optional):** `status` (`draft|confirmed|done`), `owner` (exact), `priority` (`high|medium|low`), `kind` (`action|discussion`)
- **Response `200`:** `Item[]` sorted by due date (undated last).

## PATCH /api/items/:id
Update any subset of fields.
- **Auth:** token if configured
- **Request:** `{ text?: string (non-empty, max 300), owner?: string|null, priority?: "high"|"medium"|"low", dueDate?: "YYYY-MM-DD"|null, workType?: string (non-empty, max 40), status?: "draft"|"confirmed"|"done" }`
- **Response `200`:** the updated `Item`
- **Errors:** `400 BAD_ID`, `400 BAD_TEXT`, `400 BAD_OWNER`, `400 BAD_PRIORITY`, `400 BAD_DATE`, `400 BAD_WORK_TYPE`, `400 BAD_STATUS`, `404 ITEM_NOT_FOUND`

## GET /api/patterns
Built from confirmed and done action items only.
- **Auth:** token if configured
- **Response `200`:**
```json
{
  "totalItems": 12,
  "byWorkType": { "bug fix": 4, "blocked on dependency": 3 },
  "ownerLoad": { "Asha": { "open": 3, "high": 1 } },
  "recurring": [
    { "label": "Waiting on Fabric workspace access", "workType": "blocked on dependency",
      "count": 3, "meetingDates": ["2026-10-01", "2026-10-02"], "owners": ["Ravi"] }
  ]
}
```

## Other errors
- `404 NOT_FOUND` for unknown `/api` paths; `500 INTERNAL` for unexpected failures (details are logged on the server only).
