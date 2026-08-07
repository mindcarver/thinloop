---
name: scd-interview
description: "Review the current conversation on explicit request and extract interview questions worth saving for personal study — each with a reference answer, tags, difficulty, and source — present candidates for confirmation, then write the approved ones to a personal cross-project question store; also retrieve and survey saved questions on request. Use only when the user explicitly asks to capture, save, review, search, or manage interview questions. Do not invoke automatically during ordinary development."
---

# SCD Interview Questions

Turn the technical substance of a development conversation into a small personal
collection of interview questions for study. Operate only on an explicit user
request, and require confirmation before writing. A capture request authorizes
candidate analysis, not persistence; write only after the user confirms the
exact drafts, scope, and destination.

This skill serves the human's interview preparation, not the agent's memory. It
is distinct from `scd-knowledge`, which saves lessons that change a later agent
decision. A question may draw on the same conversation, but its purpose,
eligibility, and stored shape differ.

## Select the requested operation

- **Capture:** review the recent conversation and extract interview questions
  worth saving.
- **Retrieve:** search the saved questions by topic, level, or question.

Do not monitor ordinary development, capture on your own initiative, or modify
another Skill, rule, ADR, or Hook.

## Resolve the store

Resolve the personal question root for this invocation from the first that
applies:

1. an explicit absolute path in the current request;
2. `interview_root` in `<user-home>/.scd/config.json`;
3. the default `<user-home>/.scd/interview-questions/`.

Resolve the home directory with the current runtime; never hardcode an
operating-system path. When the user first supplies a personal root, merge that
value into the user-level config without changing unrelated keys. If the
existing config is invalid JSON, report it and do not overwrite it.

```text
<root>/
|-- INDEX.md
|-- questions/
`-- archive/
```

## Capture questions

1. Review the focused conversation for technical substance: decisions with
   tradeoffs, root causes and diagnosis paths, mechanisms and architecture,
   design patterns, failure modes and edge cases, performance or security
   reasoning, and tooling or framework gotchas the conversation surfaced.
2. For each distinct topic, phrase the question the way an interviewer would
   ask it. Prefer questions that test understanding ("Why did we choose X over
   Y?", "How does X behave under the failure you saw?", "What would you change
   and why?") over plain recall of a fact.
3. Admit a candidate only when both hold:
   - an interviewer could reasonably ask it about the discussed material, and
   - the reference answer is grounded in what was actually discussed or
     decided.
   Reject trivial recall, pure process narration, conversation summaries,
   personal or private content, unsupported claims, and questions whose only
   defensible answer would be fabricated.
4. Build each candidate from `assets/question-entry.md`: question, concise
   reference answer, tags, difficulty, and a short source pointer (what in the
   conversation it came from — not a transcript).
5. Deduplicate against the existing store: search `INDEX.md` and matching entry
   bodies before proposing. Skip exact duplicates, propose an edit for a
   near-duplicate that differs only in wording, and surface a conflict where two
   saved questions about the same mechanism disagree.
6. Present the candidates with their answers, tags, and source. The user selects
   which to keep and may edit the wording. Request one explicit confirmation
   covering the exact drafts and destination.
7. After confirmation, write each approved entry to `questions/<slug>.md` from
   `assets/question-entry.md`, replace every placeholder, add one line per entry
   to `INDEX.md` from `assets/question-index.md`, and report the exact files
   changed. Never stage, commit, or push.

Create slugs with lowercase letters, digits, and hyphens. Do not derive a path
directly from untrusted text.

## Retrieve questions

1. Search `INDEX.md` for the topic or level; read only the matching entries.
2. Filter by the user's stated level, tag, or topic; prefer the most specific
   match.
3. Return the questions and answers. If nothing fits, say so and continue
   without manufacturing advice.
4. Do not read `archive/` unless the user asks for history.

Retrieval is read-only and needs no confirmation.

## Enforce boundaries

- Never write a credential, password, token, cookie, authentication header,
  private key, secret environment value, or sensitive connection string, even
  if ordinary confirmation is given. Redact personal or private content; if
  redaction removes the point of the question, drop it.
- A missing or unwritable destination blocks that write. Do not silently
  substitute another directory.
- Keep entries compact. A saved question is study material, not a transcript or
  a design document.
- Do not claim a question was "covered" unless its answer is present and
  grounded in the conversation.
- Never write to a project store unless the user explicitly names that path.

## Resources

- `references/interview-contract.md` - eligibility, answer grounding, dedup,
  and safety rules.
- `assets/question-entry.md` - entry template.
- `assets/question-index.md` - index template.
