---
name: scd-project
description: "Turn an approved project that spans multiple independently verifiable deliveries into a GitHub Initiative and an issue-level dependency DAG before implementation. Use when one request needs several delivery Issues, hard prerequisites, rolling project decomposition, or an explicit integration gate. Use scd-discovery first when the product outcome or shared rules remain open. Do not use for one coherent delivery, one complete Issue, or merely because implementation is large. This skill creates or updates project and delivery Issues, validates the graph, and reports READY, BLOCKED, PLANNED, and DONE nodes; it does not implement code, launch agents, create worktrees, merge pull requests, or run an execution loop."
---

# SCD Project

Turn an approved multi-delivery project into a small, tracker-backed delivery
graph. Stop after the graph and its executable Issues are ready; project
decomposition is not implementation authority.

Maintain these boundaries:

- the Initiative Issue owns the project outcome, shared decisions, graph
  topology, and project-level acceptance;
- each Delivery Issue is the sole requirement and acceptance source of truth
  for one independently verifiable slice;
- pull requests and independent verifiers hold implementation and delivery
  evidence;
- any derived graph snapshot is a validated coordination view, not a second
  product specification or state database.

## Select the lightest sufficient path

Use Project only when the requested outcome needs more than one independently
verifiable delivery—normally one Delivery Issue and pull request per slice—or
when those slices need a hard dependency graph or an explicit cross-slice
integration gate. Multiple pull requests caused only by implementation size do
not create a project boundary.

Do not use Project when:

- one Issue can express one coherent outcome and its acceptance;
- one material answer can make that Issue executable;
- the request is large only in implementation effort;
- future ideas do not affect the next delivery and can remain deferred.

For one clear delivery, use `scd-quickdev`. For one underdefined delivery, use
`scd-discovery`. When product-wide outcomes, users, rules, permissions, data
boundaries, or shared interfaces remain open, use `scd-discovery` first and
return only after the project core is explicitly approved.

## Start from live project truth

1. Read applicable `AGENTS.md`, `CLAUDE.md`, repository instructions, existing
   Issues, pull requests, architecture documents, shared contracts, and tests.
2. Find an existing Initiative and Delivery Issues before creating duplicates.
3. Separate confirmed project decisions, working assumptions, deferred
   deliveries, and unresolved blockers.
4. Re-read live Issue and pull-request state before reporting a node as ready
   or done.
5. Keep high-risk actions behind the human gates already required by
   `scd-quickdev`.

Do not infer project completion from checked tasks, a merged pull request, or a
closed dependency alone. A Delivery Issue is done only when its QuickDev
contract has completed independent acceptance and closure.

## Establish the project core

Confirm only the decisions shared by several deliveries:

- the project outcome and primary users;
- project boundaries and non-goals;
- shared language, invariants, permissions, and data ownership;
- shared experience or machine-readable interface contracts;
- project-level failure, integration, and release acceptance.

Use `scd-uiux` or `scd-architecture` only when those shared decisions need
design. Reconcile any shared interface before declaring dependent Delivery
Issues executable.

Do not fully specify the product's distant future. Apply rolling decomposition:
make the next useful delivery wave precise, and keep later ideas deferred or
PLANNED until evidence makes their boundaries stable.

## Decompose into delivery slices

Each executable node must be an explicitly approved GitHub Delivery Issue that:

- produces one observable outcome;
- has its own in-scope and out-of-scope boundary;
- has stable acceptance identifiers and external verification seams;
- can use one QuickDev branch, pull request, and independent acceptance lane;
- does not hide several independently valuable outcomes in one checklist.

Prefer vertical slices over frontend, backend, database, or file-based task
layers. Split technical layers only when each is independently mergeable and
verifiable against an approved shared contract.

A PLANNED placeholder may exist without an Issue while its product contract is
still immature. It cannot become READY or be handed to QuickDev. Create or
update a Delivery Issue when the exact slice contract is approved.

Add an explicit integration or release Delivery Issue when child completion
does not directly prove cross-slice behavior. It depends on the applicable leaf
nodes and owns project-level end-to-end evidence.

## Model the dependency DAG

Use a directed edge only for a hard causal prerequisite: the downstream
delivery cannot be correctly implemented or verified before the upstream
delivery is DONE.

Do not encode shared-file contention, preferred ordering, staffing, or possible
merge conflict as a fake dependency. Record those as coordination notes for a
future executor; this version does not schedule them.

Before approval or a readiness claim:

1. build the graph snapshot defined in
   `references/project-contract.md`;
2. run `scripts/validate-project-graph.mjs`;
3. reject duplicate IDs, invalid references, self-dependencies, duplicate
   dependencies, and cycles;
4. use the validator's deterministic READY, BLOCKED, PLANNED, and DONE result;
5. bring only product decisions or real blockers back to the user.

If Node.js is unavailable, state that deterministic graph validation is
`UNVERIFIED`; do not represent manual inspection as equivalent evidence.

## Review and approve the project contract

Present one compact approval summary containing:

- Initiative outcome, boundaries, shared decisions, and project acceptance;
- each materialized Delivery Issue outcome and acceptance seam;
- graph edges and their causal reason;
- PLANNED placeholders and why they are not executable;
- the current READY set, BLOCKED reasons, integration gate, and human gates.

Obtain one explicit approval before creating or materially rewriting the
Initiative and the exact Delivery Issues in that summary. That approval covers
only the shown project revision and child contracts. Silence, partial agreement,
or approval of the project idea alone is not approval of unspecified future
Issues.

Read `references/project-contract.md` before writing or updating tracker state.

## Persist the Initiative and Delivery Issues

For repository work:

1. create or update the Initiative Issue;
2. create or update only the approved Delivery Issues;
3. update the Initiative's canonical graph after Issue numbers are known;
4. mirror the Initiative link, node ID, graph revision, and hard dependencies
   in each Delivery Issue;
5. validate the resulting live snapshot again;
6. report the READY and BLOCKED sets, then stop.

Do not create a permanent local project plan, project wiki, execution database,
branch, worktree, pull request, or implementation checklist. QuickDev adds
implementation tasks only after targeted repository inspection for one
selected READY Delivery Issue.

If GitHub or the repository-authoritative tracker is unavailable, stop after
the approved summary and report the blocker. Do not silently replace the
Initiative with `.scd/specs/` or another local requirements file.

## Replan without freezing the future

Re-enter Project when the user asks what is ready, a dependency finishes, a
shared contract changes, a slice proves too broad, or new evidence changes the
graph.

- Re-read the Initiative, affected Delivery Issues, pull requests, and
  acceptance evidence.
- Increment the graph revision whenever nodes, edges, or shared project
  decisions change.
- Update affected child Issues; do not silently rewrite approved acceptance.
- Obtain approval again only when the affected outcome, visible behavior,
  scope, permissions, data or privacy boundary, irreversible action, or
  acceptance changes.
- Keep unaffected DONE evidence intact.
- Remove obsolete PLANNED placeholders instead of preserving speculative
  backlog for its own sake.

## Hand off without running a loop

This version may identify several READY Issues, but it must not automatically
launch agents or run them sequentially or in parallel. When the user explicitly
selects one READY Delivery Issue for implementation, hand only that Issue to
`scd-quickdev`.

`scd-reengineering` is an external consumer for an Initiative whose approved
contract is specifically a project-scale refactor or reimplementation. It may
execute an explicitly approved graph revision under its own READY-wave,
isolation, merge, and integration contract. This does not give Project
execution authority and does not authorize another skill or an ordinary
Initiative to launch the graph.

Do not add leases, retries, concurrency slots, resource locks, automatic
worktree creation, merge queues, deployment, or a long-running scheduler. A
supported external consumer may use the same validated Issue graph, but that
execution remains outside Project's authority.

## Resources

- `references/project-contract.md` - Initiative and Delivery Issue templates,
  graph snapshot, state derivation, approval, and replanning rules.
- `scripts/validate-project-graph.mjs` - dependency-free graph validation and
  deterministic readiness classification.
