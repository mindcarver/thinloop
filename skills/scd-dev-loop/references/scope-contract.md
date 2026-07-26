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
