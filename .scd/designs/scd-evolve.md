---
managed_by: scd-architecture
status: ready
sources:
  - .scd/specs/scd-evolve.md
  - skills/scd-dev-loop/references/scope-contract.md
  - skills/scd-dev-loop/references/evidence-contract.md
---

# Outcome and boundary

Add an explicit-only `scd-evolve` orchestration skill plus two deterministic seams: authoritative-source resolution and append-only history validation. The agent remains responsible for diagnosis, candidate presentation, approval capture, surgical editing, rollback, and verification.

## Existing context

Thinloop ships portable `skills/<name>/SKILL.md` packages to Codex, Claude Code, OpenCode, WorkBuddy, and ZCode. Shared release manifests expose the same skill root and version. `scd-dev-loop` already defines scoped implementation and evidence rules; `scd-evolve` composes those rules after a separate diagnosis and approval gate.

## Domain and responsibility changes

- **Evolution diagnosis:** classify coverage, used Thinloop skills, observed signals, attribution, counter-evidence, and confidence.
- **Evolution candidate:** one ID-addressable same-root-cause batch with explicit add/delete/replace operations.
- **Source authority:** resolve an absolute override or `thinloop_source_root`, then require a Thinloop Git checkout and reject plugin caches.
- **Evolution history:** append sanitized lifecycle events and validate their schema and transitions.
- **Trial execution:** use `scd-dev-loop` to apply only an approved candidate, preserve unrelated work, and collect verification evidence.
- **Promotion:** accept only verified trials, bump one patch version across release manifests, and leave distribution actions to a separately authorized task.

## Flow and failure behavior

1. Explicit invocation opens diagnosis; no hook or implicit trigger exists.
2. Diagnosis produces either no candidate or one candidate in `proposed` state.
3. Candidate approval must quote the candidate ID. Rejection appends `rejected` only when an authoritative source is available; otherwise it remains conversational.
4. Source resolution must succeed before the first repository write.
5. The agent appends `proposed`, snapshots batch-owned files, appends `trial`, and applies the bounded diff.
6. Deterministic changes run automated tests. Instruction, trigger, or workflow changes also run in a fresh isolated agent session.
7. Passing trial evidence updates the patch version and synchronized manifests, then reruns promoted-state checks. Only the complete passing state appends `accepted`.
8. Failed trial or promotion evidence restores batch-owned files and appends `reverted`; unavailable independent evidence appends `trial-unverified` without promotion.
9. Any invalid transition, privacy violation, overlapping dirty file, or source-authority failure stops the write path and preserves the candidate patch.

## Shared contract changes

`contracts/evolution-history.schema.json` is the shared event contract. Every JSONL line is one complete event. Required invariants not conveniently expressible in JSON Schema—append-only transitions, absolute-path and secret-pattern rejection, same candidate identity, and accepted-version monotonicity—are enforced by the deterministic history script.

Release manifests keep their existing platform-specific shapes but share version `0.6.1` after this batch is accepted.

## Data, compatibility, and migration

- History begins on first accepted write path; no synthetic baseline event is created.
- `schema_version` starts at `1.0`.
- Existing user `.scd/config.json` remains compatible; `thinloop_source_root` is an additive key and unrelated keys must be preserved.
- History records contain abstract summaries and SHA-256 evidence fingerprints only. No source-root path is stored.
- A self-evolution event requires `is_self_evolution: true` and a `source_run_id` that refers to a prior independent run.

## Security, reliability, and operations

- The source resolver performs reads only and rejects paths containing a `plugins/cache` segment.
- A valid source contains `.git`, `.codex-plugin/plugin.json` with `name: thinloop`, and `skills/scd-evolve/SKILL.md`.
- The history tool writes via create-exclusive temporary file plus rename, and validates the complete resulting stream before replacement.
- Secrets, absolute paths, traversal paths, code fences, consumer-project fields, and common credential formats are rejected.
- Rollback is limited to files owned by the approved candidate; unrelated dirty files are never restored or overwritten.
- No operation stages, commits, pushes, publishes, deploys, reinstalls, or edits an installed plugin cache.

## Alternatives and decisions

- **Rejected: automatic post-session evolution.** It removes user control and relies on platform-specific session access.
- **Rejected: raw transcript archive.** It creates unnecessary privacy and repository-retention risk.
- **Rejected: generic optimizer framework.** The approved need is one evidence-backed, human-approved batch, not population search.
- **Rejected: direct writes to installed skills.** Cache and symlink layouts differ by agent and do not establish source authority.
- **Chosen: thin agent workflow plus deterministic boundary scripts.** Attribution requires judgment; path and history invariants benefit from executable checks.

## Verification

- Parse this design and the approved specification as Markdown with required frontmatter.
- Validate the JSON Schema with a format-aware validator.
- Contract-test all A1–A13 behaviors visible in instructions and deterministic scripts.
- Exercise history transitions, privacy rejection, atomic append, source-root acceptance, and cache rejection in temporary fixtures.
- Run all existing Node tests and official Skill/plugin validators.
- Run a fresh isolated-session forward test for the new behavior instructions before accepting the batch.

## Open items

- None. Runtime installation and remote publication remain separate, explicitly authorized follow-up work.
