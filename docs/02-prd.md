# Product Requirements Document: Meeting Notes Organizer

## 1. Problem
See the Project Proposal. Standup commitments are not captured, so overdue work and recurring blockers are invisible.

## 2. Users and user stories
**Primary:** delivery lead / project manager. **Secondary:** team members who check their own items.

- As a lead, I paste a standup transcript so I do not have to log action items by hand.
- As a lead, I review and correct extracted items before they count, so AI mistakes do not become records.
- As a lead, I see all confirmed action items with owner, priority and due date, so I can chase overdue work.
- As a lead, I see which work types and which repeated items dominate, so I can fix root causes.
- As a team member, I mark my items done so the list stays honest.
- As an owner of the deployment, I can require an access token so only my team can see the notes.

## 3. Features and acceptance criteria

### Must have
**F1. Extract notes from a transcript**
- Given a transcript of at least 10 characters and at most 20,000, the system returns a meeting with action items and discussion points, all with status `draft`.
- Each action item has kind, text, owner (or null), priority (high/medium/low), due date (ISO date or null) and work type.
- Relative dates ("tomorrow", "by Friday") resolve against the meeting date, not today's date.
- If the Claude API key is missing or the call fails, rule-based extraction runs instead and the meeting is marked as such.
- Model output is sanitised: invalid priorities become `medium`, invalid dates become null, text is length-limited, and at most 100 items are kept.

**F2. Review, correct and confirm**
- Every field of an item can be edited; invalid input returns a plain-language error and changes nothing.
- "Confirm all" moves every draft item in the meeting to `confirmed` and marks the meeting confirmed.
- A meeting and all its items can be deleted.

**F3. Track confirmed action items**
- The action list shows only confirmed or done action items, sorted by due date (undated last).
- It filters by priority and status and shows how many items are overdue.
- Any action item can be marked done and reopened.

**F4. Patterns**
- Counts of confirmed action items per work type.
- A "keeps coming back" list: clusters of similar items (same work type, token similarity of at least 0.4) that appear in at least two different meeting dates.
- Open and high-priority counts per owner.

### Should have
- **F5.** Optional shared access token for all `/api` routes except `/api/health`.
- **F6.** Sample transcript button so a first-time user sees value immediately.

### Could have (not built)
- Per-user accounts, email reminders, calendar import.

## 4. Non-functional requirements
- **Performance:** extraction responds within 30 seconds (API timeout); all other endpoints under 300 ms at this data size.
- **Security:** API key only on the server; parameterised SQL only; request body limit 100 KB; constant-time token comparison; no stack traces or technical terms in user-facing errors; security headers set.
- **Reliability:** if the AI is down, the tool still works (fallback). Meeting and item creation is a single transaction.
- **Usability:** works on a 360 px wide phone; every data fetch shows a loading state; every error is plain language with a retry where it makes sense.
- **Portability:** one deployable service; no native modules to compile.

## 5. Out of scope (v1)
1. User accounts, roles and per-user permissions.
2. Audio or video upload and speech-to-text.
3. Integrations with Teams, Slack, Jira or calendars.
4. Email or push reminders for overdue items.
5. Multi-team or multi-tenant separation.
6. Editing the original transcript after extraction.
7. AI-based semantic clustering (v1 uses token similarity).

## 6. Success metrics
- At least 80% of extracted action items are accepted without edits in a sample of 10 real standups (measured by edit count per meeting).
- A lead can go from paste to confirmed in under 2 minutes.
- Zero unhandled errors in server logs during a one-week trial.

## 7. Open questions and the decisions taken
| Question | Decision and rationale |
|---|---|
| How is "similarity" defined? | Token overlap (Jaccard) within the same work type. Cheap, explainable, no embeddings needed. Revisit if clusters look wrong. |
| What about unclear transcript sections? | Extract what is clear; the human review step catches the rest. Never guess an owner that is not in the text. |
| Who can edit items? | Anyone with access to the deployment. Accounts are out of scope for v1. |
| Store raw transcripts? | Yes, so a lead can re-check an extraction, with a delete button. Documented as a privacy trade-off. |
| Database? | SQLite via Node's built-in `node:sqlite`. Chosen over Postgres/Prisma to avoid native binaries and a second service; fits a single-team data volume. |

## 8. Constraints
- Solo builder, about 8 to 12 hours, free-tier hosting.
- Claude API required for the AI feature; the key must never be committed.
- Node 22.5 or newer (for `node:sqlite`).
- Builder's work laptop blocks the public npm registry, so deployment must build on the host, not locally.

## 9. Review log (gap check, conflict check, MVP focus)
- **Gap check:** found no rule for oversize transcripts and no rule for AI failure. Added the 20,000-character limit and the fallback extractor.
- **Conflict check:** "work on mobile" conflicts with a wide patterns table. Resolved with a bar list that wraps instead of a table.
- **MVP focus:** cut user accounts and reminders; kept the confirm step because it is the control against bad AI output.
