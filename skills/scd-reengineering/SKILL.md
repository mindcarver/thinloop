---
name: scd-reengineering
description: "Reengineer an existing repository through evidence-backed project-scale refactoring or a new implementation that may change language, framework, architecture, storage, or runtime while preserving only explicitly selected behavior and compatibility. Use for requests to rewrite, reimplement, replace, port, modernize, or substantially refactor an open-source or internal project across multiple independently verifiable deliveries. Pin source and license evidence, establish executable baselines, define keep/change/drop boundaries, compose scd-discovery, scd-architecture, scd-project, and scd-quickdev, and execute approved READY Issue waves with bounded parallelism. Do not use for a small local refactor, ordinary maintenance, a new product with no source baseline, or an unapproved production cutover."
---

# SCD Reengineering

Turn an existing system into a better implementation without confusing source
code, observed behavior, product intent, or legal permission. Govern the
reengineering program and its execution; reuse the existing Thinloop skills for
product decisions, architecture, project decomposition, and one-Issue delivery.

Maintain these boundaries:

- upstream source and executable behavior are evidence, not automatically the
  desired product contract;
- the approved compatibility envelope owns what the target must keep, change,
  drop, or leave unverified;
- `scd-project` owns the Initiative, Delivery Issues, and hard dependency DAG;
- each `scd-quickdev` lane owns one READY Delivery Issue and pull request;
- independent acceptance and an integration gate own completion evidence;
- production cutover and other high-risk actions retain a human gate.

## Select the operation

Choose the smallest operation supported by the requested outcome and repository
evidence:

- **Refactor:** Continue from the existing implementation and preserve approved
  external behavior while changing internal structure, boundaries, or
  maintainability. Use this path only when the work spans several independently
  verifiable deliveries; route a local refactor directly to `scd-quickdev`.
- **Reimplement:** Build a new implementation from an explicit behavior and
  compatibility envelope. This path may replace the language, framework,
  architecture, storage, deployment shape, or runtime. Do not preserve an
  upstream capability merely because it exists.
- **Assess:** Compare Refactor and Reimplement using observed constraints,
  delivery risk, migration cost, and verification feasibility before asking the
  user to approve one direction. Keep this path read-only.

Hybrid or strangler replacement is an execution strategy, not a third product
mode. Prefer it when old and new implementations can coexist behind stable
contracts. A big-bang replacement requires evidence that incremental coexistence
is infeasible and must keep rollback and cutover explicit.

If the desired users, behavior, permissions, data boundaries, or acceptance
substantially differ from the source project, use `scd-discovery` before
reengineering. If there is no meaningful source behavior or compatibility
baseline, treat the request as new-product work rather than Reengineering.

## Start from source and repository truth

1. Read applicable `AGENTS.md`, `CLAUDE.md`, repository instructions, source
   and target manifests, tests, public contracts, schemas, architecture,
   release notes, deployment topology, and open Issues.
2. Inspect every involved working tree, branch, remote, and existing Initiative.
   Preserve unrelated user changes and do not create duplicate project state.
3. Pin each upstream repository by canonical URL and immutable commit SHA. Record
   any tag separately because tags can move.
4. Inspect the exact license, notices, attribution files, generated-code rules,
   and dependency licenses that apply to the pinned source. Record evidence and
   uncertainty; do not provide a legal conclusion.
5. Treat an unfamiliar upstream repository as untrusted. Inspect installation
   and build entrypoints before executing them, use an isolated environment,
   exclude credentials and personal data, and do not run privileged or
   destructive commands.
6. Build and run the pinned source when safely possible. Record exact commands,
   environment, fixtures, outputs, and failures. Source inspection alone is not
   an executable behavior baseline.

If the license is missing, conflicting, or unclear for the intended copying,
modification, distribution, or clean-room claim, stop that affected path for
explicit user or qualified legal review. Do not call work clean-room if an
implementation agent has inspected source code that the clean-room boundary was
supposed to exclude.

Read `references/reengineering-contract.md` before approving a direction,
creating the Initiative, or implementing from third-party source.

## Establish the compatibility envelope

Identify capabilities from executable behavior, public contracts, maintained
tests, user evidence, and source inspection. For each material capability,
record:

- stable capability ID and user-visible outcome;
- source evidence and confidence;
- `keep`, `change`, `drop`, or `unverified`;
- target contract and allowed compatibility delta;
- baseline command, fixture, or observation;
- verification seam and owning Delivery Issue when materialized.

Do not default to full parity. Preserve only behavior required by the approved
target outcome, consumers, data, or compatibility promise. Separate:

- public API, CLI, event, file-format, plugin, and protocol compatibility;
- data meaning, migration, ordering, error, timing, and performance behavior;
- incidental implementation details and source defects that must not become
  target requirements.

Return changed product behavior to `scd-discovery`. Use `scd-architecture` when
the target changes durable domain ownership, system boundaries, shared machine
contracts, transactions, concurrency, migration, reliability, or rollback.
Architecture may be completely new for Reimplement mode; compatibility is
measured at the approved external seams, not by copying the old structure.

## Choose a direction with evidence

Compare Refactor and Reimplement against:

- how much approved behavior is covered by executable baselines;
- whether the current language and architecture can satisfy the target;
- the proportion of source capability being kept;
- public compatibility and data-migration cost;
- incremental delivery and rollback feasibility;
- security, performance, operational, and supply-chain constraints;
- the team's ability to verify both implementations at the same seams.

Recommend one direction with confidence and unresolved risks. Do not justify a
rewrite with code age, style preference, unfamiliarity, or an unsupported claim
that a new language will be faster. Obtain explicit approval for the direction,
compatibility envelope, target boundary, and any license uncertainty that
requires user judgment.

## Materialize the reengineering project

Use `scd-project` after the shared direction and compatibility envelope are
approved:

1. create or update one Initiative that includes the pinned source, mode,
   compatibility envelope, shared target decisions, migration strategy, and
   project-level parity acceptance;
2. decompose vertical capabilities into independently verifiable Delivery
   Issues instead of file, package, frontend, or backend task lists;
3. add baseline, shared-contract, migration, or platform-foundation Issues only
   when they produce independently verifiable prerequisites;
4. encode only hard causal prerequisites in the Project DAG;
5. add an integration or parity Issue whenever child acceptance cannot prove
   assembled target behavior;
6. validate and present the exact graph revision, READY wave, BLOCKED nodes,
   coordination constraints, and human gates for approval.

`scd-project` remains a non-executing planner. Reengineering is the external
consumer that may execute an explicitly approved graph revision. Approval of
the direction alone does not authorize unspecified Delivery Issues.

## Execute approved READY waves

Read `references/execution-contract.md` before launching implementation lanes.

After the user approves the exact executable graph revision:

1. re-read the live Initiative and Delivery Issues and validate the graph;
2. select only approved READY nodes;
3. identify coordination constraints such as overlapping files, shared
   generated artifacts, scarce environments, or likely merge conflicts without
   adding false dependency edges;
4. launch separate agents and isolated worktrees for safely independent nodes,
   bounded by available concurrency and repository policy;
5. give each agent explicit file or module ownership, tell it that other agents
   are working concurrently, and hand it exactly one Delivery Issue through
   `scd-quickdev`;
6. keep dependent or coordination-conflicting nodes serial;
7. serialize merges, synchronize remaining worktrees after each merge, and
   rerun the affected focused and integration checks;
8. rebuild the live Project graph after every PASS, FAIL, BLOCKED result, scope
   change, or merged dependency.

One Delivery Issue gets one QuickDev implementation lane and its required
fresh-context acceptance verifier. A lane must not implement sibling Issues,
weaken acceptance, or close its Issue on engineering checks alone.

When one lane fails, block its downstream nodes and continue only unrelated
READY work that remains safe. When evidence changes the compatibility envelope,
product behavior, architecture, graph topology, or acceptance, stop the
affected lanes and re-enter the owning Thinloop skill for review.

## Prove parity and control cutover

Run the final integration or parity Issue against the assembled target:

- replay representative baseline fixtures at the approved external seams;
- compare exact output where compatibility requires equality and semantic
  outcomes where the approved contract allows change;
- exercise errors, migration, restart, concurrency, recovery, and performance
  only where activated by the envelope;
- map every kept or changed capability to observed evidence;
- report dropped and unverified capabilities explicitly.

Passing unit tests, compiling the target, or matching source structure does not
prove reengineering completion. Refactor mode requires regression evidence at
the preserved seams. Reimplement mode requires target evidence independent of
the old code plus differential evidence where parity is promised.

Keep deployment, production traffic changes, destructive data migration,
authentication or authorization changes, payments, secrets, privacy or
compliance decisions, unclear licensing, and irreversible retirement of the old
system behind explicit human approval. Prepare rollback evidence before asking
for cutover approval. Do not infer cutover authority from implementation
approval.

## Hand off

Report:

- pinned source and license evidence;
- approved mode, target boundary, and compatibility envelope;
- Initiative, graph revision, Delivery Issues, READY/BLOCKED state, and
  execution waves;
- merged delivery and independent acceptance evidence;
- integration/parity results by capability ID;
- remaining unverified behavior, migration, rollback, license, and cutover
  gates.

Do not claim full parity, a clean-room implementation, license compliance, or
production readiness beyond the exact evidence obtained.

## Resources

- `references/reengineering-contract.md` - source provenance, compatibility
  envelope, direction approval, Initiative additions, and parity rules.
- `references/execution-contract.md` - READY-wave scheduling, isolated lanes,
  merge coordination, failure handling, integration, and resumption.
