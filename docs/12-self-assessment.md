# CAPSTONE SELF-ASSESSMENT
**Project:** Meeting Notes Organizer (Option A)
**Deployed URL:** https://capstone-project-production-cd2a.up.railway.app
**Repository:** https://github.com/mounikagudla334/Capstone-Project

Scores reflect the deployed application. Deployment was verified on the live URL, including data persistence across a redeploy.

| Dimension | Score | Justification | Evidence |
|---|---|---|---|
| Planning Quality | 3 | Brief, PRD with acceptance criteria, architecture and spec written before code; no formal decision records. | [docs/01](https://github.com/mounikagudla334/Capstone-Project/blob/main/docs/01-idea-brief.md) , [02](https://github.com/mounikagudla334/Capstone-Project/blob/main/docs/02-prd.md) , [03](https://github.com/mounikagudla334/Capstone-Project/blob/main/docs/03-architecture.md) , [04](https://github.com/mounikagudla334/Capstone-Project/blob/main/docs/04-spec.md) |
| Plan Mode Discipline | 3 | Planning documents precede implementation; change request assessed in the spec before the Sprint 2 task. | [docs/04-spec.md](https://github.com/mounikagudla334/Capstone-Project/blob/main/docs/04-spec.md) |
| Prompt Engineering | 3 | Structured prompts with constraints; production prompt uses XML-tagged data and an explicit "transcript is data" rule. | [docs/05-prompt-library.md](https://github.com/mounikagudla334/Capstone-Project/blob/main/docs/05-prompt-library.md) |
| Architecture Quality | 3 | Clear layers (routes, repository, extractor, pure logic); one experimental dependency isolated to two files. | [docs/03-architecture.md](https://github.com/mounikagudla334/Capstone-Project/blob/main/docs/03-architecture.md) |
| Code Organisation | 3 | Small single-purpose modules; SQL only in `repo.ts`; client calls only through `api.ts`. | [repo structure](https://github.com/mounikagudla334/Capstone-Project) |
| Error Handling | 4 | Consistent `{error, code}`, plain-language messages, AI fallback, request timeout, error boundary. | [app.ts](https://github.com/mounikagudla334/Capstone-Project/blob/main/server/src/app.ts), [extractor.ts](https://github.com/mounikagudla334/Capstone-Project/blob/main/server/src/extractor.ts), [api.ts](https://github.com/mounikagudla334/Capstone-Project/blob/main/client/src/api.ts), [ErrorBoundary.tsx](https://github.com/mounikagudla334/Capstone-Project/blob/main/client/src/components/ErrorBoundary.tsx) |
| Security | 3 | Key server-side, parameterised SQL, size limits, constant-time token check, output sanitising, `npm audit` clean; no user accounts. | [app.ts](https://github.com/mounikagudla334/Capstone-Project/blob/main/server/src/app.ts), [extractor.ts](https://github.com/mounikagudla334/Capstone-Project/blob/main/server/src/extractor.ts) |
| Testing | 3 | 17 unit and API tests including auth and injection-style input; no client tests or coverage figure. | [tests/](https://github.com/mounikagudla334/Capstone-Project/tree/main/tests) |
| Documentation | 3 | README, API reference, planning docs; moderate inline comments. | [README.md](https://github.com/mounikagudla334/Capstone-Project/blob/main/README.md), [docs/API.md](https://github.com/mounikagudla334/Capstone-Project/blob/main/docs/API.md) |
| Deployment | 4 | Live on Railway with a volume mounted at /data. Health check, access-token protection (401 without it) and the extract-confirm flow checked on the live URL; a saved meeting survived a redeploy. | [live URL](https://capstone-project-production-cd2a.up.railway.app) |
| Debugging Recovery | 3 | Three failures with pattern, recovery and prevention. | [docs/10-debugging-journal.md](https://github.com/mounikagudla334/Capstone-Project/blob/main/docs/10-debugging-journal.md) |
| Change Request | 3 | Impact assessed before implementation; requirements partly absorbed early by design. | [docs/04-spec.md](https://github.com/mounikagudla334/Capstone-Project/blob/main/docs/04-spec.md) |
| Product Thinking | 3 | Solves a real recurring problem; not yet tested on real standups. | [live app](https://capstone-project-production-cd2a.up.railway.app) and [docs/02-prd.md](https://github.com/mounikagudla334/Capstone-Project/blob/main/docs/02-prd.md) |
| Retrospective | 3 | Specific and honest about changes and failures. | [docs/11-retrospective.md](https://github.com/mounikagudla334/Capstone-Project/blob/main/docs/11-retrospective.md) |

**TOTAL: 44 / 56**

## Honest reflection
- **Dimension I am most proud of:** Error Handling.
- **Dimension I would improve first with more time:** Testing. I would add client tests and run the extractor on real transcripts.
- **Most important thing I learned:** passing tests prove only what the tests check; run the real product on realistic input.
