# Scope contract

Use this reference only when the requested outcome or boundary may be ambiguous.

## Material ambiguity test

Ask the user only when choosing without them could change one of:

- visible product behavior;
- public API or persisted data;
- architecture or compatibility;
- security or privacy posture;
- an irreversible or external action;
- which independent requirement is in scope.

Do not ask merely because several implementations are valid. Inspect the repository, choose the smallest convention-aligned approach, and continue.

## Scope derivation

Before editing, establish internally:

1. **Outcome** — what becomes observably true.
2. **Boundary** — the most likely tempting expansion that remains out of scope.
3. **Acceptance** — how the outcome can be checked.
4. **Location** — where existing repository evidence says the change belongs.

Keep this in conversation context for ordinary work. Do not create a document for a clear local task.

## Discovery handoff

Use full discovery when the request is a greenfield product, application, plugin, service, or system, or when it contains several dependent product decisions. A single isolated ambiguity needs only one concise clarification.

When a relevant `.scd/specs/<slug>.md` exists:

1. require `status: approved` before implementation;
2. treat its outcome, boundaries, decisions, and acceptance as the product contract;
3. preserve stable acceptance identifiers;
4. choose reversible implementation details without another approval.

If a complete specification was already explicitly approved with the implementation request, do not ask the user to approve it twice.

Return to discovery only when new evidence changes:

- outcome or visible behavior;
- in-scope or out-of-scope behavior;
- public API, persisted data, privacy, or permissions;
- an irreversible or expensive-to-reverse external choice;
- an approved acceptance item.

Clarifying wording, replacing an internal dependency, reorganizing modules, or changing a test layout does not reopen discovery when observable behavior remains intact.

## Medium-project documents

Prefer existing repository documentation homes. When none exist, a medium project may keep:

- approved delivery specifications under `.scd/specs/`;
- one evolving `.scd/architecture.md` for long-lived system boundaries;
- `.scd/tasks/current.md` only while unfinished work needs continuity.

Keep core data in the architecture document until ownership, lifecycle,
migration, synchronization, permissions, audit, or cross-entity invariants
justify `.scd/domain.md`. Prefer an existing contract home and format; when
none exists, keep new machine-readable cross-boundary contracts in the visible
root `contracts/` directory.

Create `.scd/designs/<feature>.md` only for a feature with consequential cross-module, concurrency, transaction, integration, algorithm, migration, or rollback design. Do not create a permanent `implementation-plan.md`; temporary execution order belongs in current task state.

## Search funnel

Use the least context needed:

1. repository instructions and top-level structure;
2. likely module and nearby patterns;
3. `rg` for concrete symbols, behavior, and tests;
4. targeted implementations and call sites;
5. broader exploration only if evidence remains conflicting.

Use association to search, but use repository evidence to decide. A plausible name is a candidate, not implementation authority.

## Scope-change handling

When implementation evidence contradicts the original interpretation:

- update the plan instead of following it mechanically;
- tell the user only when the new path changes the product result or authority boundary;
- leave unrelated defects and cleanup as observations, not silent additions.
