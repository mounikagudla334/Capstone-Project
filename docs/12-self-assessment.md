# CAPSTONE SELF-ASSESSMENT
**Project:** Meeting Notes Organizer (Option A)
**Deployed URL:** [add after deployment]
**Repository:** [add after pushing to GitHub]

Scores are provisional where they depend on steps still to be done after this document was written (deployment and the demo video). Update them after deployment, and lower any score you cannot support.

| Dimension | Score | Justification | Evidence |
|---|---|---|---|
| Planning Quality | 3 | Brief, PRD with acceptance criteria, architecture and spec written before code; no formal decision records. | `docs/01` to `docs/04` |
| Plan Mode Discipline | 3 | Planning documents precede implementation; change request assessed in the spec before the Sprint 2 task. | `docs/04-spec.md` section 8 |
| Prompt Engineering | 3 | Structured prompts with constraints; production prompt uses XML-tagged data and an explicit "transcript is data" rule. | `docs/05-prompt-library.md` |
| Architecture Quality | 3 | Clear layers (routes, repository, extractor, pure logic); one experimental dependency isolated to two files. | `docs/03-architecture.md` |
| Code Organisation | 3 | Small single-purpose modules; SQL only in `repo.ts`; client calls only through `api.ts`. | repo structure |
| Error Handling | 4 | Consistent `{error, code}`, plain-language messages, AI fallback, request timeout, error boundary. | `app.ts`, `extractor.ts`, `api.ts`, `ErrorBoundary.tsx` |
| Security | 3 | Key server-side, parameterised SQL, size limits, constant-time token check, output sanitising, `npm audit` clean; no user accounts. | `app.ts`, `extractor.ts` |
| Testing | 3 | 17 unit and API tests including auth and injection-style input; no client tests or coverage figure. | `tests/` |
| Documentation | 3 | README, API reference, planning docs; moderate inline comments. | `README.md`, `docs/API.md` |
| Deployment | 2 (provisional) | Deployment guide written; raise to 3 or 4 after a live smoke test. | live URL |
| Debugging Recovery | 3 | Three failures with pattern, recovery and prevention. | `docs/10-debugging-journal.md` |
| Change Request | 3 | Impact assessed before implementation; requirements partly absorbed early by design. | `docs/04-spec.md` section 8 |
| Product Thinking | 3 | Solves a real recurring problem; not yet tested on real standups. | demo walkthrough |
| Retrospective | 3 | Specific and honest about changes and failures. | `docs/11-retrospective.md` |

**TOTAL: 42 / 56 (provisional)**

## Honest reflection
- **Dimension I am most proud of:** Error Handling.
- **Dimension I would improve first with more time:** Testing. I would add client tests and run the extractor on real transcripts.
- **Most important thing I learned:** passing tests prove only what the tests check; run the real product on realistic input.
