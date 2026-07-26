# Architecture readiness review

Use this review before marking a baseline or feature design `ready`, declaring
a shared contract ready, or completing Validate work. Run it silently and
surface only real findings.

## Trace behavior to responsibility

For each approved acceptance behavior:

- identify the domain rule or deliberate absence of one;
- identify the component or actor responsible;
- identify authoritative data and permission enforcement;
- identify the interface operation, event, file, command, or internal seam;
- identify how implementation can prove the behavior.

Flag behavior with no owner, multiple conflicting owners, or no verification
seam.

## Check domain coherence

Verify:

- product terminology is preserved;
- states and transitions do not contradict approved behavior;
- invariants have one enforceable authority;
- cross-entity consistency and compensation are explicit where needed;
- identity, time, money, units, permissions, and tenant ownership are not
  represented ambiguously;
- caches, projections, and UI state are not mistaken for sources of truth.

Return missing business choices to Discovery. Do not repair them as technical
assumptions.

## Check system boundaries

Verify:

- every component has one concise responsibility and explicit exclusions;
- data ownership and trust boundaries are unambiguous;
- synchronous and asynchronous flows preserve required semantics;
- transaction, concurrency, ordering, retry, idempotency, timeout, and failure
  behavior are covered where activated;
- external dependencies have failure and fallback behavior;
- cross-cutting requirements have a technical owner and observable evidence.

## Check shared contracts

For each activated boundary:

1. resolve the canonical contract path;
2. run a format-aware parser, linter, compiler, or generator;
3. validate representative examples where supported;
4. compare product terms, domain operations, UX states, errors, permissions,
   and contract identifiers;
5. inspect producer and consumer compatibility;
6. record exact commands, exit codes, and meaningful output.

File existence, valid YAML syntax, or a rendered documentation page alone does
not prove a usable contract.

## Check change safety

For existing systems, verify:

- the design is an intentional delta rather than an unexplained rewrite;
- affected producers, consumers, data, and operational dependencies are named;
- compatibility and rollout order are explicit;
- destructive or semantic data changes have migration, observation, and
  rollback paths;
- superseded decisions or contracts are clearly deprecated, replaced, or
  removed.

## Check artifact discipline

Verify:

- the product specification owns business behavior;
- UX owns interaction behavior;
- architecture owns technical responsibility;
- machine contracts own cross-boundary syntax and semantics;
- information is referenced rather than copied between sources;
- `draft` remains wherever an open item can change boundaries,
  compatibility, security, or acceptance;
- `ready` is not presented as a second product approval.

## Report

Map each readiness claim to observed evidence, `UNVERIFIED`, or a named
blocker. Name the smallest responsible next step:

- Discovery for product behavior;
- UIUX for experience behavior;
- Architecture for internal design or shared-contract convergence;
- Dev Loop only after the required handoff is ready.
