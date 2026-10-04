# Debugging Journal

Three real failures from this build. Each followed Stop, Diagnose, Plan, Execute.

---
## 1. The test runner could not load the database module
**What happened:** after writing the API tests, `tests/api.test.ts` failed to load at all: `Failed to load url sqlite (resolved id: sqlite). Does the file exist?` The unit tests, which do not touch the database, passed.

**Failure pattern (Module 10):** hallucinated compatibility, a variant of hallucinated API. I assumed the tooling would accept the newer built-in `node:sqlite` the way it accepts older built-ins like `node:fs`. Nothing had checked that assumption.

**Recovery applied:**
- *Stop:* no more edits to the tests.
- *Diagnose:* the error named `sqlite`, not `node:sqlite`, so the loader had stripped the prefix and then looked for a package. Root cause: Vite 5, which Vitest runs on, does not recognise `sqlite` as a built-in because it is too new.
- *Plan:* the smallest fix is to stop Vite seeing the import. Load the module at runtime through `createRequire`, and keep a type-only import for the types.
- *Execute:* changed `db.ts` only.

**Outcome:** the API test file loaded and its tests ran.

**How to prevent it next time:** before choosing an experimental built-in, run a two-line spike under the real test runner. Prefer the stack's known-compatible options when a new one gives little extra value.

---
## 2. Errors thrown in an async route never reached the error handler
**What happened:** after fix 1, two API tests failed. The log showed the friendly error being thrown (`status: 400, code: 'BAD_DATE'`) but it surfaced as an unhandled rejection and the request hung until the test timed out after 10 seconds.

**Failure pattern (Module 10):** hallucinated API behaviour. The code assumed Express forwards a rejected promise from an `async` handler to the error middleware. That is true in Express 5, but this project uses Express 4.

**Recovery applied:**
- *Stop:* did not touch the validation code, which was correct.
- *Diagnose:* the stack trace passed through Express's router internals and ended in my validation; the error handler never appeared in it. So the throw was correct and the delivery was not.
- *Plan:* wrap async handlers so a rejection calls `next(err)`.
- *Execute:* added a small `wrap()` helper and applied it to the only async route (`POST /api/meetings`).

**Outcome:** all 17 tests passed; invalid dates now return `400 BAD_DATE` instantly with the friendly message.

**How to prevent it next time:** put the framework version in the prompt ("Express 4") and the rule "wrap async handlers" in the spec, as the final spec now does.

---
## 3. "It is urgent." became its own item
**What happened:** I ran the real server and posted a sample transcript. The fallback extractor made the fix a medium-priority action and turned the next sentence, "It is urgent.", into a separate discussion point. All tests were green because none of them checked priority.

**Failure pattern (Module 10):** under-specified requirement, so the output looked plausible but did not do what was meant. The spec said "high only for urgent items" but not how to link a follow-up sentence to the item it describes.

**Recovery applied:**
- *Stop:* did not tweak the keyword list, which was not the problem.
- *Diagnose:* sentences were classified one at a time with no memory of the previous one.
- *Plan:* a short (five words or fewer) urgent follow-up after an action in the same line raises that action's priority and is not stored as a separate item.
- *Execute:* changed `fallbackExtract` only, then added two assertions to the unit test for priority and for the absence of the stray item.

**Outcome:** the sample now produces one high-priority action with the right owner and due date. Tests: 17 of 17.

**How to prevent it next time:** write acceptance criteria as input and output examples, and run the real app on the sample data before calling a feature done, not only the tests.
