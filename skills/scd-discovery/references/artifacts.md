# Discovery artifacts

Create the minimum artifact that preserves continuing value. For repository
delivery, one GitHub Issue is the sole requirement and acceptance source of truth.

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

## GitHub Issue

After the combined contract is ready, present it to the user for explicit
approval. Then create or update one GitHub Issue:

```markdown
## Outcome

## Users and problem

## Shared language

## User scenarios

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

Discovery owns the approved product contract. `scd-quickdev` may refine
implementation tasks and evidence, but must return product-visible changes to
the user and update the Issue before proceeding.

If the repository has no GitHub remote, authenticated write path, or
repository-authoritative equivalent tracker, stop after the approved summary
and report the blocker. Do not silently create a local specification.

## Technical documents

The Issue owns requirements and acceptance. Keep technical documents only when
their complexity justifies them:

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
  the affected decisions, and obtain explicit approval before implementation
  continues.

Promote repeated shared terminology to `.scd/context.md` only when it causes
recurring cross-Issue ambiguity.
