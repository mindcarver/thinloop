---
name: scd-knowledge
description: "Capture evidence-backed development experience as concise, approved project or personal cross-project Markdown knowledge, and retrieve, update, merge, or archive that knowledge on request. Use only when the user explicitly asks to capture, review, save, search, update, or manage development experience or knowledge. Do not invoke automatically during ordinary development."
---

# SCD Knowledge

Preserve proven experience without turning every conversation into permanent context. Operate only on an explicit user request and require confirmation before changing knowledge. A capture request authorizes candidate analysis, not persistence; write only after the user confirms the exact draft, scope, destination, and create or update action.

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
2. Admit a candidate only when it is reusable, plausibly changes a later agent decision or action, and is hard to discover unaided because of at least one barrier:
   - **Semantic:** project language, abbreviation, or meaning cannot be derived from the words alone.
   - **Location:** the authoritative entry point or responsibility is not on the intuitive search path.
   - **Behavioral:** a counterintuitive mechanism, constraint, or failure mode is not safely derivable from ordinary reasoning.
   Use the barrier during review and evaluation; do not add it as a required persisted field.
3. Reject generic advice, ordinary facts, task narration, conversation summaries, transient state, personal preference presented as team practice, one-off instructions, unsupported inference, and guidance that does not tell a later agent what to do.
4. Match evidence to the claim. Semantic knowledge needs an attributable human definition or approved source. Location knowledge needs the named path or symbol and its responsibility verified. Behavioral knowledge needs the smallest observed failure, mechanism, correction, and focused test or runtime result that supports the causal claim.
5. Verify every named path, symbol, method, command, configuration key, and version against the current repository or authoritative tool output. Source search can disprove a claim but does not by itself prove runtime behavior. Do not present an unverified or stale code-dependent claim as established knowledge.
6. Reduce each candidate to a trigger, guidance, boundary, minimal sufficient evidence, and source. Do not save a transcript, full log, or large code excerpt.
7. Recommend **project** scope when the conclusion depends on repository names, paths, architecture, private infrastructure, team conventions, or a project-specific version. Recommend **cross-project** scope when it remains actionable outside this repository and names its technology, platform, or situational boundary. Prefer project scope when portability is uncertain.
8. Search both active indexes and any plausible matching entries. Compare trigger, guidance, and boundary. Skip duplicates; propose an edit for a material refinement; surface a conflict instead of overwriting it. Never bridge-merge entries merely because A overlaps B and B overlaps C.
9. When the user explicitly asks to review a completed delivery, use the verified Issue boundary, pull request, confirmed findings, and acceptance evidence as candidate sources. A merged PR, passing suite, or acceptance `PASS` alone does not prove a reusable lesson. This review never starts automatically and never authorizes a write.
10. Redact direct secrets and unnecessary personal paths. If redaction removes the evidence needed for the conclusion, do not propose the entry.
11. Show the concise draft, discoverability barrier, behavior expected to change, scope rationale, exact destination, evidence, and whether it will create or update files. Request one explicit confirmation.
12. After confirmation, replace every template placeholder, write the entry from `assets/knowledge-entry.md`, update the active index from `assets/knowledge-index.md`, and report the exact files changed. Never stage, commit, or push.

A single well-supported project experience may be cross-project knowledge; repeated occurrence is not required.

Read `references/knowledge-contract.md` before classifying, deduplicating, redacting, or proposing a write.

## Retrieve knowledge

1. Search the project `INDEX.md` first, then the personal `INDEX.md` when configured and available.
2. Select the smallest relevant set, normally no more than three entries. Do not read `archive/` unless the user asks for history or conflict analysis.
3. Read only those entries, check their triggers and boundaries against the current task, and prefer the more specific project guidance. Treat an active entry as contextual evidence, not unquestionable authority.
4. Before applying a code-dependent entry, verify its named repository facts when practical. If a source, path, symbol, version, or behavior is stale, false, contradicted, or outside the current boundary, do not apply it; report the reason and offer a separately confirmed maintenance action.
5. Return the applicable action and name the entries used. If nothing fits, say so and continue without manufacturing advice.

If one store is unavailable, report it and continue with the other. Do not describe a partial search as a search of both stores.

## Maintain knowledge

- **Duplicate:** make no write.
- **Refinement:** require one uniquely appropriate target, then present a concise edit that preserves the original trigger, boundary, mechanism, and safest specific guidance. When several entries are plausible targets, do not force an update.
- **Conflict:** show the old conclusion, new evidence, and likely boundary difference; let the user choose whether to narrow, replace, or retain conditional variants.
- **Archive:** move the inactive entry to `archive/`, mark it archived or superseded, and remove it from `INDEX.md`.

Require confirmation before every update, merge, replacement, or archive. Ordinary retrieval is read-only and needs no write confirmation.

## Enforce completion boundaries

- Never write a credential, password, token, cookie, authentication header, private key, secret environment value, or sensitive connection string, even if ordinary confirmation is given.
- A missing or unwritable destination blocks that write. Do not change project/cross-project scope as a fallback.
- A failed write may return the approved Markdown draft, but must not claim persistence.
- Keep Markdown compact. When a method needs substantial steps or exceptions, recommend promotion to a dedicated Skill instead of expanding the entry.
- Do not claim that retrieval, citation, task success, or later acceptance proves the knowledge caused a better outcome. Attribute behavior improvement only through a controlled comparison or an explicit human judgment.
