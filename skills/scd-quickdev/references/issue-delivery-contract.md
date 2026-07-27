# Issue delivery contract

Use this reference for GitHub Issue creation, task isolation, pull requests,
merge decisions, and user acceptance.

## Source of truth

For repository delivery, the GitHub Issue is the sole requirement and
acceptance source of truth. The pull request holds implementation and
verification evidence. Local SCD state is temporary recovery data only.

Do not silently replace the GitHub Issue with a local product specification
under `.scd/`.

If the repository has no GitHub remote or authenticated write path, stop before
implementation and report the blocker. A clear user request may authorize the
ordinary Issue write, but it cannot create missing access.

## Issue body

For a feature or change, preserve this minimum structure:

```markdown
## Outcome

## User problem

## In scope

## Out of scope

## Confirmed decisions

## Failure and edge cases

## Acceptance

- [ ] A1: <observable behavior>

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

Do not use `Closes #<issue>` while real-use acceptance remains pending.

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

## Real-use UAT

After an eligible merge:

1. add the `awaiting-uat` label when it already exists; otherwise add an Issue
   comment with the same status;
2. give the user the real product path and a concise acceptance checklist;
3. leave the Issue open during real-use acceptance;
4. close the Issue after the user confirms acceptance;
5. if UAT fails, record the observed result and environment on the same Issue,
   keep it open, and start a new fix branch from current `main`.

The agent owns engineering correctness and merge evidence. The user owns
real-use acceptance.
