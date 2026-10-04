# Retrospective: Meeting Notes Organizer

**How the plan changed.** The original idea from Module 4 assumed a Postgres database and AI-based similarity grouping. During architecture I changed both. My work laptop blocks the public npm registry, which is a real constraint here, so I chose SQLite through Node's built-in `node:sqlite`, which needs no compiled package and keeps deployment to one service. I replaced AI-based clustering with token similarity inside a work type, because it is explainable and free to run, and I recorded that decision in the PRD's open questions. The human review step from the first PRD survived unchanged, and it is the control I trust most. The Sprint 2 change request (clear errors, mobile layout, loading states) changed little in the architecture because the spec already required plain-language errors and mobile-first layouts. That was the benefit of reading the whole brief before designing.

**What went wrong.** Three failures, documented in the debugging journal. The test runner could not load `node:sqlite`; async route errors never reached my error handler because I assumed Express 5 behaviour in an Express 4 project; and the rule-based extractor split "It is urgent." away from the task it described. The first two were wrong assumptions about tools. The third got past a green test suite and was only visible when I ran the real app on sample data.

**The hardest part** was writing acceptance criteria precise enough to catch the third failure. "Priority is high only for urgent items" sounds complete and is not.

**Key learnings.**
- Put framework versions and the rules that depend on them into the prompt and the spec.
- Spike any experimental dependency under the real test runner before committing to it.
- Passing tests prove only what the tests check. Run the product on realistic input.
- A draft-then-confirm step is the cheapest protection against AI mistakes.

**What I would build differently.** I would test the extractor against five real standup transcripts before designing the patterns screen, because the value of everything downstream depends on extraction quality. I would also add semantic similarity once real data shows where token matching fails.

**What I am most proud of.** The tool still works when the AI is unavailable, and nothing the model returns is trusted without validation. That is the difference between a demo and something a team could rely on.
