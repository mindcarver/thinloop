# Discovery artifacts

Create the minimum artifact that preserves continuing value. An approved
greenfield product uses `.scd/product/prd.md` for the product baseline. A clear
change to an existing product keeps one GitHub Issue as the sole requirement
and acceptance source of truth. For an approved multi-delivery project,
`scd-project` creates one Initiative plus separate Delivery Issues; do not
force the project into one Issue.

## Authority boundaries

| Artifact | Authoritative for |
|---|---|
| `.scd/product/prd.md` | Greenfield product vision, users, problem, MVP scope, `FR-*` requirements, and success metrics |
| Initiative Issue | Delivery topology, shared coordination decisions, graph revision, and project integration acceptance |
| Delivery Issue | One slice's boundary, acceptance, verification seams, and PRD traceability |
| UX and Architecture artifacts | Experience and technical design within the approved product contract |
| Pull request and verifier evidence | Implementation and observed delivery proof |

Do not duplicate the full PRD into tracker Issues or let design artifacts
silently redefine product scope.

## Temporary discovery state

Do not create state for a short same-session discussion. When continuity is
necessary, use `.scd/tasks/current.md`:

```yaml
---
managed_by: scd-discovery
status: active
updated_at: 2026-07-27T12:34:56+08:00
---
```

Allowed statuses are `active` and `blocked`. Keep non-empty sections:

- `## Outcome`
- `## Boundaries` with `In` and `Out`
- `## Acceptance`
- `## Decisions`
- `## Evidence`
- `## Next action`

Acceptance may contain provisional checklist items. Distinguish confirmed,
assumed, deferred, and open decisions. Keep exactly one next decision or
investigation. When the GitHub Issue exists, add its URL to the note and retain
only the delta required to resume.

Remove temporary discovery state after handoff. Never keep a second current task
in the same worktree.

## Greenfield product PRD

After explicit approval of a greenfield product requested as repository work,
create `.scd/product/prd.md` from `../assets/product-prd.md`. Do not create a
permanent draft before approval.

Use this frontmatter:

```yaml
---
managed_by: scd-discovery
status: approved
version: 1
updated_at: 2026-07-30T12:34:56+08:00
approved_at: 2026-07-30T12:34:56+08:00
---
```

The PRD must contain:

- product vision;
- primary users;
- user problem and current alternative;
- MVP goals and non-goals;
- core user journeys;
- functional requirements with unique, stable `FR-*` identifiers;
- rules and failure cases;
- data, permissions, and integrations;
- success metrics;
- assumptions and risks;
- open questions;
- approval status and approved version.

A material change to product behavior, MVP scope, permissions, data boundaries,
or success criteria requires renewed approval and a version increment. Wording
clarifications may update `updated_at` without changing the version. Never
renumber an existing requirement merely because ordering changes; retire or
replace it explicitly.

Use the repository's normal low-risk document-delivery path so the approved PRD
version is reachable from the default branch before Project reports an
implementing node READY or QuickDev begins product implementation. If that
cannot be established, report the downstream handoff as blocked.

## GitHub Issue

After a single-delivery combined contract is ready, present it to the user for
explicit approval. Then create or update one GitHub Issue:

```markdown
## Outcome

## Users and problem

## Shared language

## User scenarios

## Product traceability

- PRD: `.scd/product/prd.md`, or Not applicable
- Approved version: <positive integer>, or Not applicable
- Requirements: `FR-001`, ..., or Not applicable

## Confirmed decisions

## Failure and edge cases

## Constraints

## In scope

## Out of scope

## Acceptance

- [ ] A1: <observable behavior>

## Verification seams

## Assumptions

## Deferred decisions

## Implementation tasks

- [ ] To be refined by QuickDev after repository inspection

## Verification

- A1: Not run

## Unknowns

- None
```

Omit optional empty sections instead of filling them with boilerplate. Preserve
stable acceptance identifiers. Do not put hidden reasoning or secrets in the
Issue.

For greenfield work, Discovery owns the approved PRD and the Delivery Issue
owns the approved delivery slice. `scd-quickdev` may refine implementation
tasks and evidence, but must return product-visible changes to Discovery,
update the PRD when the product contract changes, and update the Issue before
proceeding. For an existing-product change without a PRD, the Issue remains the
complete product and delivery contract.

When the approved contract spans multiple independently verifiable deliveries,
do not use this single-Issue template for the entire project. Hand the shared
project core to `scd-project`, whose Initiative owns project topology while
each Delivery Issue owns one slice's requirements and acceptance.

If the repository has no GitHub remote, authenticated write path, or
repository-authoritative equivalent tracker, stop after the approved summary
and report the blocker. Do not silently create a local specification.

## Technical documents

The approved greenfield PRD owns product requirements; the Issue owns one
delivery slice and its acceptance. Keep design documents only when their
complexity justifies them:

- one evolving `.scd/architecture.md` when no repository-native architecture
  home exists;
- `.scd/ux/<slug>.md` for a substantial design-bearing Web experience;
- `.scd/designs/<feature>.md` for consequential feature-local architecture;
- repository ADRs for irreversible cross-cutting technical decisions;
- a visible root `contracts/` directory for new shared machine-readable
  contracts when no repository convention exists.

Do not create a permanent `implementation-plan.md`; keep task breakdown in the
Issue and use `.scd/tasks/current.md` only for temporary recovery.

Architecture and technical design do not add fixed approval gates. Return to
discovery only when a design choice changes the approved outcome, visible
behavior, scope, data or privacy boundary, permissions, irreversible action, or
acceptance.

## Contract changes after approval

- **Implementation change:** update Issue tasks or verification without another
  approval.
- **Wording clarification without behavior change:** update the Issue and note
  it in the handoff.
- **Product contract change:** update the affected Issue sections, discuss only
  the affected decisions, update and version the greenfield PRD when one
  governs the product, and obtain explicit approval before implementation
  continues.

Promote repeated shared terminology to `.scd/context.md` only when it causes
recurring cross-Issue ambiguity.
