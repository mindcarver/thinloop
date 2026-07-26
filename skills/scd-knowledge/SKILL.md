---
name: scd-knowledge
description: "Capture evidence-backed development experience as concise, approved project or personal cross-project Markdown knowledge, and retrieve, update, merge, or archive that knowledge on request. Use only when the user explicitly asks to capture, review, save, search, update, or manage development experience or knowledge. Do not invoke automatically during ordinary development."
---

# SCD Knowledge

Preserve proven experience without turning every conversation into permanent context. Operate only on an explicit user request and require confirmation before changing knowledge.

## Select the requested operation

- **Capture:** extract one or more lessons from the current work or from experience the user states.
- **Retrieve:** search prior project and personal knowledge for the user's current problem.
- **Maintain:** update, merge, replace, or archive existing knowledge.

Do not monitor ordinary development, create speculative knowledge, or modify another Skill, rule, ADR, or Hook. Recommend a better carrier when appropriate and let the user start that separate change.

## Resolve the stores

Use the repository root for project knowledge:

```text
.scd/knowledge/
|-- INDEX.md
|-- entries/
`-- archive/
```

Resolve personal knowledge from an explicit absolute path for this invocation, then from `knowledge_root` in the user-level `<user-home>/.scd/config.json`. When the user first supplies a personal root, merge that value into the user-level config without changing unrelated keys. Resolve the home directory with the current runtime; never hardcode an operating-system path.

Read `references/storage-contract.md` before configuring a root, creating a store, or handling an unavailable path.

## Capture knowledge

1. Inspect the focused conversation, relevant repository state, and observed checks. A conclusion produced by the agent must have supporting evidence. Explicit human practice is itself an attributable source.
2. Reduce each candidate to a trigger, guidance, boundary, minimal sufficient evidence, and source. Do not save a transcript, full log, or large code excerpt.
3. Recommend **project** scope when the conclusion depends on repository names, paths, architecture, private infrastructure, team conventions, or a project-specific version. Recommend **cross-project** scope when it remains actionable outside this repository and names its technology, platform, or situational boundary. Prefer project scope when portability is uncertain.
4. Search both active indexes and any plausible matching entries. Skip duplicates; propose an edit for a material refinement; surface a conflict instead of overwriting it.
5. Redact direct secrets and unnecessary personal paths. If redaction removes the evidence needed for the conclusion, do not propose the entry.
6. Show the concise draft, scope rationale, exact destination, and whether it will create or update files. Request one explicit confirmation.
7. After confirmation, replace every template placeholder, write the entry from `assets/knowledge-entry.md`, update the active index from `assets/knowledge-index.md`, and report the exact files changed. Never stage, commit, or push.

A single well-supported project experience may be cross-project knowledge; repeated occurrence is not required.

Read `references/knowledge-contract.md` before classifying, deduplicating, redacting, or proposing a write.

## Retrieve knowledge

1. Search the project `INDEX.md` first, then the personal `INDEX.md` when configured and available.
2. Select the smallest relevant set, normally no more than three entries. Do not read `archive/` unless the user asks for history or conflict analysis.
3. Read only those entries, check their triggers and boundaries against the current task, and prefer the more specific project guidance.
4. Return the applicable action and name the entries used. If nothing fits, say so and continue without manufacturing advice.

If one store is unavailable, report it and continue with the other. Do not describe a partial search as a search of both stores.

## Maintain knowledge

- **Duplicate:** make no write.
- **Refinement:** present a concise edit to the existing entry.
- **Conflict:** show the old conclusion, new evidence, and likely boundary difference; let the user choose whether to narrow, replace, or retain conditional variants.
- **Archive:** move the inactive entry to `archive/`, mark it archived or superseded, and remove it from `INDEX.md`.

Require confirmation before every update, merge, replacement, or archive. Ordinary retrieval is read-only and needs no write confirmation.

## Enforce completion boundaries

- Never write a credential, password, token, cookie, authentication header, private key, secret environment value, or sensitive connection string, even if ordinary confirmation is given.
- A missing or unwritable destination blocks that write. Do not change project/cross-project scope as a fallback.
- A failed write may return the approved Markdown draft, but must not claim persistence.
- Keep Markdown compact. When a method needs substantial steps or exceptions, recommend promotion to a dedicated Skill instead of expanding the entry.
