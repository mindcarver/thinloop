# Architecture contract

Use this reference for Product or Evolution work, durable architecture
artifacts, domain splitting, and architecture readiness review.

## Contents

- [Responsibility boundary](#responsibility-boundary)
- [Baseline and evolution](#baseline-and-evolution)
- [Domain modeling](#domain-modeling)
- [System model](#system-model)
- [Activated quality concerns](#activated-quality-concerns)
- [Artifact lifecycle](#artifact-lifecycle)

## Responsibility boundary

Architecture owns the technical model that supports approved behavior:

- domain concepts, state transitions, invariants, and technical ownership;
- components, responsibilities, dependencies, and trust boundaries;
- authoritative data, projections, caches, and lifecycle;
- runtime and data flows, transactions, consistency, and failure containment;
- cross-cutting security, privacy, reliability, performance, and observability;
- integration, compatibility, migration, rollout, and rollback design;
- references to canonical machine-readable interface contracts.

It does not own product scope, user-visible business decisions, interaction
design, production code, migration execution, or deployment. Reference those
sources instead of restating them.

## Baseline and evolution

For a 0-to-1 system, establish one concise baseline in
`.scd/architecture.md`. Cover only the current coherent delivery and durable
boundaries likely to survive its implementation.

For an existing system:

- investigate actual code, contracts, data stores, runtime, and ADRs first;
- preserve the current baseline unless evidence shows it is wrong;
- update the baseline only for a durable component responsibility, data owner,
  runtime flow, trust boundary, or cross-cutting constraint;
- use `.scd/designs/<feature>.md` for feature-local coordination, transaction,
  concurrency, integration, migration, rollback, or alternative decisions;
- do not rewrite the repository architecture to explain one endpoint or module.

## Domain modeling

Translate approved business behavior into a technical model:

- use the product language without renaming concepts casually;
- identify entities, value objects, aggregates, policies, commands, queries,
  events, and projections only where they clarify responsibility;
- state lifecycle transitions and invariants in enforceable terms;
- identify the authority that accepts or rejects each command;
- separate business time, identity, money, quantity, and external identifiers
  when their semantics differ;
- place permission, audit, and transaction enforcement explicitly;
- name cross-entity consistency and compensation rules.

Keep this model inside `.scd/architecture.md` by default. Split
`.scd/domain.md` only when at least one concern becomes independently complex:

- multiple interacting lifecycles or aggregates;
- approval, ledger, settlement, or entitlement rules;
- multi-tenant ownership and permission matrices;
- cross-entity invariants or long-running workflows;
- synchronization, offline reconciliation, audit, or regulatory history;
- schema evolution or migration that changes domain meaning.

A split domain contract remains subordinate to approved product behavior. It is
not permission to invent a missing rule.

## System model

For each activated component, record:

- responsibility and explicit non-responsibility;
- owned data and source of truth;
- inbound and outbound dependencies;
- trust and transaction boundaries;
- synchronous, asynchronous, and batch flows;
- failure containment, retry, idempotency, and recovery;
- observable evidence that the component fulfills its responsibility.

Prefer a small component and flow diagram when relationships are hard to
understand in prose. The prose owns decisions; diagrams illustrate them.

## Activated quality concerns

Do not paste a universal non-functional checklist. Expand only concerns that
can change design or acceptance:

- authentication, authorization, tenant isolation, secrets, and audit;
- personal or regulated data, retention, export, and deletion;
- latency, throughput, capacity, cost, and backpressure;
- consistency, concurrency, deduplication, ordering, and idempotency;
- availability, retry budgets, timeout, circuit breaking, and degradation;
- logs, metrics, traces, alerts, and diagnostic boundaries;
- compatibility, versioning, migration, rollout, rollback, and disaster
  recovery.

State a measurable target or explicit constraint when one exists. Otherwise
state the architectural decision and the condition that would reopen it.

## Artifact lifecycle

Fallback paths:

```text
.scd/
├── architecture.md
├── domain.md
└── designs/
    └── <feature>.md
```

Prefer repository-native locations when they exist. Start baseline and
feature-local documents from the matching asset template.

Allowed statuses:

- `draft` - a material design or shared-contract decision remains open;
- `ready` - readiness review passes and remaining notes cannot change
  implementation boundaries or compatibility.

`ready` is not a human approval gate. The linked approved GitHub Issue
owns product approval. Expensive or irreversible decisions are confirmed when
encountered rather than at a mandatory final ceremony.
