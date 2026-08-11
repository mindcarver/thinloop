# Issue delivery contract

Use this reference for GitHub Issue creation, task isolation, pull requests,
merge decisions, and independent agent acceptance.

## Source of truth

For repository delivery, the GitHub Issue is the sole source of truth for the
selected delivery boundary, acceptance, and verification seams. The pull
request holds implementation and verification evidence. Local SCD state is
temporary recovery data only.

For a greenfield product with an approved `.scd/product/prd.md`, that PRD
remains authoritative for product-level why, users, problem, MVP scope,
`FR-*` requirements, and success metrics. The Delivery Issue references the
approved version and requirements it implements; it does not duplicate or
silently override the PRD.

Do not silently replace a Delivery Issue with a local implementation
specification. Do not treat an unapproved or uncommitted PRD as shared product
authority.

If the repository has no GitHub remote or authenticated write path, stop before
implementation and report the blocker. A clear user request may authorize the
ordinary Issue write, but it cannot create missing access.

## Planning confirmation preference

Before any Issue mutation or implementation, ask whether the user wants to
review and confirm the complete Issue draft, implementation approach, and task
checklist for this delivery, unless the current request or approved upstream
handoff already gives that answer. Read-only repository inspection is allowed
before this decision and is required before presenting a confirmation-ready
draft.

- `No`: proceed autonomously and record `Required: No`, `Status: Waived`.
- `Yes`: present the complete proposed Issue body and wait. Do not create or
  update the Issue, change repository files, or implement until the user
  explicitly confirms it. Then record `Required: Yes`, `Status: Confirmed`.

For an existing Issue, present its exact proposed edits rather than an abstract
summary. Material changes to a confirmed implementation approach, task list,
scope, or acceptance require another explicit confirmation before those changes
are written or implemented. This preference does not create a local `plan.md`;
the confirmed Issue remains the sole durable delivery plan.

## Issue body

For a feature or change, preserve this minimum structure:

```markdown
## Outcome

## User problem

## Product traceability

- PRD: `.scd/product/prd.md`, or Not applicable
- Approved version: <positive integer>, or Not applicable
- Requirements: `FR-001`, ..., or Not applicable

## In scope

## Out of scope

## Confirmed decisions

## Planning confirmation

- Required: Yes, or No
- Status: Confirmed, or Waived

## Failure and edge cases

## Acceptance

- [ ] A1: <observable behavior>

## Implementation approach

- <concrete technical direction and affected seams>

## Implementation tasks

- [ ] <small verifiable task>

## Verification

- A1: Not run

## Unknowns

- None
```

Discovery owns the approved product sections. QuickDev adds or updates the
implementation tasks and verification after inspecting the repository. Do not
store hidden reasoning, secrets, or speculative future work.

When Product traceability is applicable, QuickDev must confirm that the exact
approved PRD version is reachable from the default branch and every named
`FR-*` identifier exists. A missing, stale, contradictory, or widened reference
returns to Discovery and cannot be implemented as a READY delivery.

For a bug, also record:

```markdown
## Observed symptom

## Expected behavior

## Reproduction

## Diagnosis

- Root cause: `Unconfirmed`

## Regression evidence

- Not run
```

Change `Unconfirmed` to `Confirmed` only when code or runtime evidence supports
the causal path.

## Branch and worktree isolation

Every meaningful repository task gets a unique branch. Use an issue-linked name
such as:

- `fix/<issue>-<slug>` for a bug;
- `feat/<issue>-<slug>` for a feature;
- `chore/<issue>-<slug>` for maintenance or configuration.

Never reuse generic branches such as `bug-fix` or `feature`.

Use a worktree only when:

- the current checkout contains unrelated changes that must remain untouched;
- another task or agent is proceeding in parallel;
- the task must survive across sessions without occupying the main checkout;
- risk, tooling, or repository instructions require physical isolation.

For one clean sequential task, create the branch in the current worktree.
Before editing, verify the branch starts from the intended `main` revision.

## Pull request and engineering gate

The agent owns engineering acceptance:

1. map every Issue acceptance item to direct evidence, `UNVERIFIED`, or a
   blocker;
2. review the full issue-specific diff and exclude unrelated files;
3. commit and push the issue branch;
4. create the pull request with `Refs #<issue>`, scope summary, risk, and
   acceptance evidence;
5. wait for required CI, tests, builds, and repository checks;
6. repair only in-scope failures and repeat affected checks;
7. merge into `main` when all required checks pass and no human merge gate
   applies.

Do not use `Closes #<issue>` before independent acceptance passes.

After merge, synchronize local `main`. Remove the merged branch or temporary
worktree only when it contains no uncommitted state.

## Human merge gates

Require explicit human approval before merging changes involving:

- authentication or authorization;
- payments or billing;
- destructive data or schema changes;
- secrets, privacy, legal, or compliance boundaries;
- production infrastructure or irreversible external actions;
- any repository rule that requires human review.

Create the pull request and present evidence while waiting. Do not weaken branch
protection or approval rules.

Merge authorization does not authorize deployment. If merging `main`
automatically deploys to production, treat the merge as a production action and
obtain the required explicit human approval. Prefer Preview or Staging for
pre-production evidence when available.

## Independent acceptance

After implementation and engineering checks, launch one separate fresh-context
subagent as the acceptance verifier. Give it the governing Issue, repository
location, and exact acceptance target: base and target refs for committed
changes, or the workspace state before commit. Do not give it the implementing
agent's conclusions. The verifier must:

1. read the Issue acceptance items and applicable repository instructions;
2. inspect the actual issue-specific diff;
3. run directly relevant checks and real-environment
   paths, including browser, real-model, or produced-artifact validation when
   the changed behavior depends on them;
4. avoid modifying product code;
5. return acceptance `PASS`, `FAIL`, or `BLOCKED` with reproducible evidence
   mapped to every acceptance item.

`PASS` authorizes eligible merge and explicit Issue closure after the merged
revision is confirmed. `FAIL` returns the evidence to implementation, keeps the
Issue open, and requires another independent verification after repair.
`BLOCKED` records the missing environment or dependency and keeps the Issue
open. If merge, deployment, or environment state can change the observed result,
rerun the affected acceptance path on `main` before closing.

The parent agent owns delivery orchestration. The independent verifier owns the
acceptance verdict. Human approval remains required only for the high-risk
boundaries listed above or a repository-enforced human gate.
