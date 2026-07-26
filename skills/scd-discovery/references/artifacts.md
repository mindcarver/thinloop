# Discovery artifacts

Create the minimum artifact that preserves information with continuing value. Prefer repository-native issue, specification, architecture, and ADR locations when they already exist.

## Temporary discovery state

Do not create state for a short, same-session discussion. When continuity is necessary, use `.scd/tasks/current.md`:

```yaml
---
managed_by: scd-discovery
status: active
updated_at: 2026-07-26T12:34:56+08:00
---
```

Allowed statuses are `active` and `blocked`. Keep non-empty sections:

- `## Outcome`
- `## Boundaries` with `In` and `Out`
- `## Acceptance`
- `## Decisions`
- `## Evidence`
- `## Next action`

During discovery, Acceptance may contain provisional checklist items. Decisions must distinguish confirmed, assumed, deferred, and open content. Evidence should name repository or external facts already checked. Next action contains exactly one decision or investigation needed to resume.

When discovery completes, either turn the file into implementation continuity state or remove it. Never keep a second current task in the same worktree.

## Delivery specification

For repository work, create `.scd/specs/<slug>.md` only after the contract converges:

```markdown
---
managed_by: scd-discovery
status: review
---

# Outcome

# Users and Problem

# Shared Language

# User Scenarios

# Rules and Decisions

# Failure and Edge Cases

# Constraints

# In Scope

# Out of Scope

# Testing Seam

# Acceptance

- A1: <observable behavior>

# Assumptions

# Deferred Decisions
```

Omit an empty optional section rather than filling it with boilerplate. After explicit approval, set `status: approved`.

Do not include volatile file paths, function names, code snippets, or step-by-step implementation tasks unless a small prototype encodes a product decision that prose cannot preserve.

## Medium-project baseline

For a medium project, prefer two durable documents and one temporary carrier:

- approved delivery specifications under `.scd/specs/`;
- one evolving `.scd/architecture.md` when the repository has no existing architecture home;
- `.scd/tasks/current.md` only while unfinished work needs continuity.

When a UI-heavy delivery activates `scd-uiux`, it may add one
`.scd/ux/<slug>.md` experience contract. This is optional design handoff, not a
third document required for every medium project and not a second product
approval.

When a delivery activates `scd-architecture`, keep ordinary domain and system
design in `.scd/architecture.md`. Use `.scd/designs/<feature>.md` for a
consequential feature-local delta. Prefer the repository's existing contract
home and format; when none exists, place new machine-readable interface
contracts in the visible root `contracts/` directory.

The architecture document records system purpose, components and
responsibilities, runtime and data flow, core data, external dependencies,
cross-cutting constraints, verification boundaries, and durable architecture
decisions. Keep it concise and update it only when those boundaries change.

Keep core entities in the architecture document unless ownership, permissions,
lifecycle, migration, synchronization, audit, or cross-entity invariants become
a major source of complexity. Only then split `.scd/domain.md`.

Create `.scd/designs/<feature>.md` only when a specific feature has cross-module coordination, concurrency, transactions, retries, complex integration, algorithmic trade-offs, migration, rollback, or multiple expensive alternatives. Do not create a permanent `implementation-plan.md`; use current task state for temporary execution order.

Architecture and technical design do not add fixed approval gates. Return to discovery only when a design choice changes the approved outcome, visible behavior, scope, data or privacy boundary, permissions, irreversible action, or acceptance.

## Contract changes after approval

- **Implementation change:** no specification update or approval.
- **Wording clarification without behavior change:** update the specification and mention it in the handoff.
- **Product contract change:** set the specification back to `review`, discuss only affected decisions, and obtain explicit approval again.

Promote repeated shared terminology to `.scd/context.md` only after it appears across specifications or causes recurring ambiguity. Promote irreversible cross-cutting technical decisions to an existing ADR system when one exists.
