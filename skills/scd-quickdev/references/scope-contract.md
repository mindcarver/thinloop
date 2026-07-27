# QuickDev scope contract

Use this reference only when the requested outcome or boundary may be
ambiguous.

## Material ambiguity test

Ask the user only when choosing without them could change one of:

- visible product behavior;
- public API or persisted data;
- architecture or compatibility;
- security or privacy posture;
- an irreversible or external action;
- which independent requirement is in scope.

Do not ask merely because several implementations are valid. Inspect the
repository, choose the smallest convention-aligned approach, and continue.

## Scope derivation

Before editing, establish:

1. **Outcome** — what becomes observably true.
2. **Boundary** — the most likely tempting expansion that remains out of scope.
3. **Acceptance** — how the outcome can be checked.
4. **Location** — where repository evidence says the change belongs.

Keep this in conversation for ordinary work. Put the approved requirement and
acceptance contract in the GitHub Issue, not a local specification.

## Discovery handoff

Use full discovery for a greenfield product, application, plugin, service, or
system, or when several dependent product decisions remain. One isolated
ambiguity needs only one concise clarification.

When a governing Issue exists:

1. treat its outcome, boundaries, decisions, and acceptance as authoritative;
2. preserve stable acceptance identifiers;
3. choose reversible implementation details without another approval;
4. update the Issue before changing any product-visible contract.

If a complete Issue was already approved with the implementation request, do
not ask the user to approve it twice.

Return to discovery only when new evidence changes:

- outcome or visible behavior;
- in-scope or out-of-scope behavior;
- public API, persisted data, privacy, or permissions;
- an irreversible or expensive-to-reverse external choice;
- an approved acceptance item.

Clarifying wording, replacing an internal dependency, reorganizing modules, or
changing a test layout does not reopen discovery when observable behavior
remains intact.

## Technical documents

The Issue owns product requirements and acceptance. Existing repository
architecture, ADR, UX, and machine-contract homes may still own technical
design:

- one evolving `.scd/architecture.md` only when no repository-native home
  exists;
- `.scd/ux/<slug>.md` for a substantial design-bearing Web experience;
- `.scd/designs/<feature>.md` for consequential feature-local technical design;
- a visible root `contracts/` directory for new shared machine-readable
  contracts when no repository convention exists.

Do not create a permanent implementation plan. Keep the task checklist on the
Issue and temporary resume state in `.scd/tasks/current.md` only when needed.

## Search funnel

Use the least context needed:

1. repository instructions, Issue, and top-level structure;
2. likely module and nearby patterns;
3. targeted symbol search and code intelligence;
4. implementations, call sites, and focused tests;
5. broader exploration only if evidence remains conflicting.

Use association to search, but repository evidence to decide. A plausible name
is a candidate, not implementation authority.

## Scope-change handling

When implementation evidence contradicts the original interpretation:

- update the plan instead of following it mechanically;
- update the Issue and request a decision only when the new path changes the
  product result or authority boundary;
- leave unrelated defects and cleanup as observations, not silent additions.
