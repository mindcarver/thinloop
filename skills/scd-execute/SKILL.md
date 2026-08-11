---
name: scd-execute
description: "Execute an approved Thinloop Initiative by consuming its live scd-project Delivery-Issue DAG, selecting the current safe READY wave, and delegating exactly one Issue per isolated scd-quickdev lane. Use when the user asks to start, continue, resume, or finish an approved multi-delivery project, run its current READY Issues, or execute its DAG. Default to all safely independent READY nodes up to available concurrency unless the user requests a narrower or serial wave. Develop lanes in parallel when safe, merge eligible pull requests one at a time, and recompute the graph after every delivery change. Do not use for one Issue, project decomposition, an unapproved or stale graph, or as a persistent scheduler."
---

# SCD Execute

Turn an approved Initiative graph into bounded delivery waves without making
Project a scheduler or widening QuickDev across multiple Issues.

Maintain these boundaries:

- `scd-project` owns the Initiative, Delivery Issues, hard dependency DAG, graph
  revision, and deterministic `READY`, `BLOCKED`, `PLANNED`, and `DONE` states;
- Execute owns live wave selection, temporary coordination constraints,
  isolated lane launch, serial merge coordination, and graph recomputation;
- each `scd-quickdev` lane owns exactly one READY Delivery Issue, branch,
  pull request, engineering evidence, and independent acceptance;
- the Initiative's integration or release Issue owns assembled project
  acceptance when independently accepted children do not prove the whole;
- existing human gates still own production, destructive, authentication,
  payment, secrets, privacy, compliance, and other irreversible actions.

Execute is an observable orchestration pass, not a daemon or second project
database.

## Select the operation

Use Execute when the user asks to start, continue, resume, or finish an approved
Initiative, execute its DAG, or deliver the current READY Issues.

Do not use Execute when:

- one Delivery Issue is selected; use `scd-quickdev`;
- the Initiative, child contracts, or graph still need creation or revision;
  re-enter `scd-project`;
- product or shared technical decisions remain open; return to their owning
  Thinloop skill;
- the request is only to report current progress, readiness, unfinished work, or
  the recommended continuation; use `scd-next`;
- a reengineering program has not completed its source, direction,
  compatibility, and graph-approval gates; remain in `scd-reengineering`.

A plain request to continue an approved Initiative authorizes the current safe
READY wave and later waves on the same approved graph revision. It does not
authorize material scope changes, a new graph revision, or a high-risk action.

## Start from live project truth

1. Read applicable `AGENTS.md`, `CLAUDE.md`, repository instructions, the live
   Initiative, child Delivery Issues, pull requests, default branch, branches,
   worktrees, shared contracts, and required checks.
2. Confirm the exact Initiative graph revision is approved and still canonical.
3. Rebuild the graph snapshot from live tracker evidence and run
   `scd-project`'s `scripts/validate-project-graph.mjs`.
4. Accept only materialized, approved `READY` Delivery Issues. Refuse stale
   revisions, invalid graphs, `PLANNED` placeholders, `BLOCKED` nodes, missing
   Issue evidence, or nodes already executing in another lane.
5. Re-read state before every new wave and before every merge.

Do not infer `DONE` from a commit, branch, checked task, merged pull request, or
implementer summary. Use the Project and QuickDev completion contracts.

Read `references/execution-contract.md` before launching a lane, creating a
worktree, coordinating merges, resuming execution, or reporting project
completion.

## Select the current safe READY wave

Begin with every node deterministically reported `READY` by the validated live
graph. Unless the user requested a narrower or serial wave, select all safely
independent READY nodes up to available agent slots and repository policy.

Apply explicit user overrides:

- "only Issue #N" selects that node if it is READY;
- "serial" selects one READY node at a time;
- "at most N in parallel" caps the wave at N;
- an explicit Issue list selects only those READY nodes.

Then apply temporary coordination constraints such as overlapping file or
module ownership, shared generated artifacts, one mutable fixture or
environment, repository policy, or merge-conflict risk. These constraints may
serialize READY nodes, but they are not causal dependencies and must not be
written into the Project DAG as fake edges.

Report the selected wave, deferred READY nodes, coordination reasons, and
current blockers before launching. Do not ask the user to manually select nodes
when the default safe wave is unambiguous.

## Launch isolated QuickDev lanes

For every selected node:

1. synchronize the intended base branch;
2. create a unique Issue-linked branch and isolated worktree;
3. assign exactly one Delivery Issue and explicit file or module ownership;
4. tell the lane that sibling agents may be active and it must preserve and
   adapt to their work rather than revert it;
5. invoke `scd-quickdev` with the Initiative, current graph revision, selected
   Delivery Issue, worktree, and applicable product, UX, architecture, and
   machine contracts;
6. require the normal task-local checks, pull request, and independent
   fresh-context behavioral acceptance;
7. prohibit sibling Issue implementation, cross-lane staging, acceptance
   weakening, direct default-branch pushes, production mutation, or unapproved
   scope changes.

Bound active lanes by observable agent capacity. Do not start detached
background work that the parent cannot monitor, reconcile, or stop.

If isolated worktrees or safe ownership cannot be established, serialize the
affected nodes. If `scd-quickdev` is unavailable, mark the lane `BLOCKED`;
Execute must not implement the Issue itself.

## Merge and unlock serially

Development may run in parallel, but merge eligible pull requests one at a
time:

1. confirm the lane still targets the selected Issue and approved graph
   revision;
2. require QuickDev's acceptance `PASS`, plus repository checks and any human
   gate;
3. merge one eligible pull request;
4. synchronize the base branch;
5. safely update or rebase remaining worktrees;
6. rerun checks whose evidence can change against the new base;
7. close the Delivery Issue only under its QuickDev contract;
8. rebuild and validate the live Project graph.

If a merge invalidates a sibling's assumptions or evidence, pause that lane for
reinspection and reverification. Green checks against different base revisions
do not prove the assembled project.

Continue with the next safe READY wave while the graph revision remains
approved and no material decision or high-risk gate changes. Stop when the
Initiative is complete, no nodes are READY, a lane fails or blocks all useful
progress, or approval must be renewed.

## End every execution pass with an actionable handoff

After the final live graph recomputation, classify the pass before replying.
Never report only “no READY nodes”; state whether the pass ended, the
Initiative ended, or a different owner must act.

| State | Evidence | Required handoff |
| --- | --- | --- |
| `COMPLETE` | Valid graph; every required node is `DONE`; required integration acceptance passed. | Report Initiative completion and remaining human gates, if any. |
| `ROLLING_REPLAN_REQUIRED` | Valid open Initiative; no `READY` nodes; remaining executable work is only `PLANNED` placeholders. | Name each placeholder and its stated blocker. Explain that this is neither a failed execution nor a request to redo Discovery; do not make the user redo Discovery. Direct the user to `scd-project` to review and approve the next exact Delivery-Issue contracts and graph revision; Execute must not materialize them. |
| `EXTERNAL_OR_HUMAN_BLOCK` | No `READY` nodes because a named authority, environment, dependency, or human gate blocks remaining work. | Name the blocking evidence, required authority, and owner. Do not send the user to Project merely to hide that block. |
| `INVALID_OR_STALE_GRAPH` | The Initiative revision is invalid, stale, missing materialized Issue evidence, or no longer canonical. | Name the failed graph evidence and return to `scd-project` for repair or revision before any execution resumes. |

For `ROLLING_REPLAN_REQUIRED`, provide one copy-ready continuation prompt that
includes the Initiative identifier, completed upstream nodes, the named planned
nodes, and their blockers. State that the governing PRD and current product
scope remain in force unless the live evidence says otherwise; do not imply
that `scd-discovery` or `scd-quickdev` should restart. The prompt may ask
`scd-project` to present the next graph revision for approval, but must not
promise Issue creation or implementation before that approval.

Every terminal response must name the completed wave, current Initiative state,
the classification above, the evidence used, and exactly one next action or
explicitly say that none remains. This is a user-facing handoff, not a
notification service or a persistent scheduler.

## Handle failure and replanning

Classify every lane:

- `PASS` - QuickDev independent acceptance passed and the Issue may complete;
- `FAIL` - acceptance ran and the observed result violates the Issue contract;
- `BLOCKED` - required authority, dependency, environment, isolation, or
  evidence is unavailable.

On `FAIL` or `BLOCKED`, record direct evidence on the Delivery Issue, block its
downstream nodes, and continue only unrelated READY work whose contract and
evidence remain valid. Return changed product behavior to Discovery, shared
technical boundaries to Architecture, and changed nodes or edges to Project.

Do not retry indefinitely, broaden scope, weaken acceptance, or edit the DAG to
hide coordination problems.

## Prove project completion

Independently accepted child Issues do not prove assembled behavior when the
Initiative defines an integration or release gate. Execute that gate as its own
Delivery Issue through QuickDev after its dependencies become READY.

Report project completion only when:

- every required Delivery Issue is `DONE`;
- the current approved graph validates;
- the integration or release Issue passed when required;
- no required acceptance item or high-risk human gate remains open.

## Resume without a scheduler database

Reconstruct execution state from the Initiative and graph revision, live child
Issues, pull requests, independent acceptance evidence, branches, worktrees,
and the synchronized default branch. Treat local task notes only as temporary
resume hints.

Do not add leases, resource locks, an execution database, automatic retries, a
merge daemon, deployment automation, or another long-running scheduler.

## Resources

- `references/execution-contract.md` - execution authority, wave selection,
  lane isolation, merge coordination, failure, integration, and resumption.
