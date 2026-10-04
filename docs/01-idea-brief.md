# Project Proposal: Meeting Notes Organizer

**Capstone option:** A, AI-Powered Internal Business Tool (uses the Claude API)

## Problem statement
Daily standups produce real commitments: who will do what, by when, and what is blocking whom. These live only in people's memory or scattered chat messages. Nobody can see which items are overdue, who is overloaded, or which blockers keep coming back week after week.

## Target user
A delivery lead or project manager who runs a daily standup with an onsite and offshore team (5 to 12 people) and is accountable for follow-through. They are comfortable pasting a transcript or notes but have no time to log action items by hand.

## Value proposition
Paste a standup transcript and get structured notes in seconds: action items with owner, priority, due date and work type, plus separate discussion points. Review and correct them, confirm, and over time see which work types dominate and which items keep reappearing across meetings.

## MVP scope (3 features)
1. **Extract:** transcript in, structured action items and discussion points out (Claude API, with a rule-based fallback if the API is unavailable).
2. **Review and track:** edit any extracted field, confirm the meeting, then filter confirmed action items by priority and status and mark them done.
3. **Patterns:** group confirmed items by work type and flag items that recur across different meetings.

## Top 3 risks
1. **Wrong extraction creates bad records.** Mitigation: every meeting starts as a draft; nothing counts until a human confirms it.
2. **Transcript content is sensitive.** Mitigation: transcripts stay on the owner's own server, can be deleted, and the API key never reaches the browser.
3. **AI output is untrusted input.** Mitigation: strict sanitising of every field returned by the model, and a prompt that tells the model to ignore instructions inside transcripts.

## Biggest assumption
That a lead will take 30 seconds to review extracted items if the review screen is fast. If they will not, the tool becomes a source of unchecked data. The draft/confirm design exists to test this assumption.
