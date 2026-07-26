---
name: scd-architecture
description: "Design or validate domain models, system boundaries, data ownership, and shared machine-readable interface contracts before production implementation. Use for 0-to-1 products after the product core is stable; new services, modules, public APIs, events, or integrations; consequential data, permission, transaction, concurrency, compatibility, migration, rollback, or reliability decisions; architecture evolution in an existing repository; or an explicit architecture, domain-model, or interface-design request. Compose it with scd-discovery, scd-uiux, and scd-dev-loop. Do not use for a clear local implementation, a trivial endpoint already governed by existing contracts, pure UI/UX work, or production coding, migration execution, and deployment."
---

# SCD Architecture

Turn approved product behavior into a coherent technical design and verifiable
shared contracts without making architecture a mandatory stage for every
change. Design and validate; leave production implementation to
`scd-dev-loop`.

## Select the lightest sufficient path

Inspect the request and repository, then choose internally:

- **Direct:** the change fits existing boundaries and contracts. Hand it to
  `scd-dev-loop` without architecture questions or artifacts.
- **Focused:** one interface, domain rule mapping, module boundary, data
  ownership decision, or technical trade-off needs design.
- **Product:** a 0-to-1 system needs a domain, system, and interface baseline
  after its product core is stable.
- **Evolution:** an existing system needs an architectural delta. Preserve the
  baseline and document only durable boundary changes or activated feature
  risks.
- **Validate:** existing architecture or contracts need a read-only coherence,
  compatibility, or implementation-readiness audit.

Do not announce these path names unless the user asks about the method. Project
size alone does not justify Product work, and one new endpoint does not justify
rewriting the architecture.

## Start from product and repository truth

Read applicable repository instructions, approved delivery specifications,
ready UX contracts when activated, existing architecture and ADRs, interface
contracts, schemas, code boundaries, runtime configuration, tests, and
deployment topology before asking questions. Inspect actual code and
machine-readable contracts; filenames and diagrams are only candidates.

For Product work, require the product core to establish users, outcome,
business behavior, permissions, boundaries, and acceptance. Product
specifications own business decisions. Architecture may translate approved
rules into entities, states, invariants, commands, events, and ownership, but
must not invent missing product behavior. Return material gaps to
`scd-discovery`.

After the product core stabilizes, architecture may proceed in parallel with
`scd-uiux`. Neither waits for the other to finish, but both must reconcile
operations, data, errors, permissions, and terminology through the shared
interface contract before independent frontend and backend implementation.

## Establish the design slice

Identify the smallest complete architectural outcome and the acceptance
behaviors it supports. Expand only activated concerns:

- domain model, lifecycle, invariants, permissions, or business transactions;
- component boundaries, responsibilities, dependencies, and data ownership;
- runtime and data flow, consistency, concurrency, retries, and failure;
- shared API, event, file, CLI, plugin, or internal module contracts;
- security, privacy, latency, capacity, audit, retention, and observability;
- compatibility, migration, rollout, rollback, and external integrations.

Ask one material decision at a time only when repository evidence and approved
constraints cannot answer it. Give a recommendation and rationale. Choose
reversible, convention-aligned technical details autonomously. Request a user
decision when vendor lock-in, public compatibility, security or privacy
boundaries, destructive migration, or another expensive-to-reverse choice is
at stake.

## Model domain and system responsibilities

Read `references/architecture-contract.md` for Product work, Evolution work,
durable artifacts, or architecture readiness review.

Map approved business rules to technical responsibility:

- name the owner of each state transition and invariant;
- place transaction and consistency boundaries deliberately;
- distinguish authoritative data from projections, caches, and UI state;
- make permission enforcement and trust boundaries explicit;
- define failure containment, retry, idempotency, and recovery where activated;
- trace components and flows to product acceptance.

Keep the ordinary domain model in `.scd/architecture.md`. Split
`.scd/domain.md` only when ownership, lifecycle, permissions, audit,
cross-entity invariants, synchronization, settlement, or migration makes the
domain independently complex.

For an existing system, update `.scd/architecture.md` only when a durable
component responsibility, data owner, runtime flow, trust boundary, or
cross-cutting constraint changes. Use `.scd/designs/<feature>.md` for
consequential feature-local coordination, transactions, concurrency,
integration, migration, rollback, or alternative analysis.

## Produce shared machine-readable contracts

Read `references/interface-contract.md` whenever work crosses a frontend,
service, plugin, event, file, or module boundary.

Prefer the repository's existing contract location and format. When none
exists, use the visible root `contracts/` directory. Choose a format that the
actual consumers can parse, such as OpenAPI, GraphQL SDL, AsyncAPI, JSON Schema,
Protocol Buffers, or a language-level schema with runtime validation.

Architecture facilitates contract convergence but does not own it alone and
must not unilaterally finalize the interface. Use approved product behavior for
business semantics, UX interface needs for observable states, and frontend and
backend constraints for the final shared contract. Do not copy field tables
into architecture prose.

Markdown may hold rationale or an early interface sketch, but a boundary that
enables independent implementation cannot become `ready` until its canonical
contract is machine-readable, parses with a real tool, and includes the
activated operations, types, errors, permissions, and representative examples.

## Validate with the smallest real evidence

Read `references/readiness-review.md` before setting an architecture or feature
design to `ready`, declaring a contract ready, or completing Validate work.

Run the strongest available checks against the actual artifacts:

- parse, lint, or compile every machine-readable contract with a format-aware
  tool;
- validate representative examples and generated types or mocks when practical;
- inspect breaking changes and consumer compatibility;
- verify acceptance, UX states, domain behavior, and contract operations map
  consistently;
- exercise an isolated technical spike when feasibility cannot be established
  from repository evidence.

An isolated spike may create disposable, non-production code to answer one
named question. Record its setup, observed result, and limitation. Do not merge
it into application entry points or dependencies. This skill must not write
production business code, execute a real data migration, alter live
infrastructure, or deploy.

If a required parser or consumer check cannot run, keep the relevant artifact
`draft` and report the exact unverified boundary.

## Preserve only durable design

Keep short advice and clear local decisions in conversation. Prefer existing
repository documentation and contract locations. When no suitable architecture
home exists:

- create or evolve `.scd/architecture.md` from
  `assets/architecture-contract.md` for the system baseline;
- create `.scd/designs/<feature>.md` from `assets/feature-design.md` for a
  consequential feature-local design;
- create `.scd/domain.md` from `assets/domain-contract.md` only after the
  complexity threshold is met;
- place new machine contracts under root `contracts/`.

Use `status: draft` while a material design or shared-contract decision remains
and `status: ready` after readiness review. `ready` is mechanical and semantic
readiness, not a second product approval. Do not create PRDs, sprint files,
frontend architecture documents, duplicated API prose, or permanent
implementation plans.

## Route changes and hand off

- Return changed user behavior, business rules, permissions, data or privacy
  boundaries, irreversible actions, or acceptance to `scd-discovery`.
- Return changed journeys, surfaces, interaction feedback, responsive behavior,
  accessibility, or visual direction to `scd-uiux`.
- Resolve internal, reversible architecture decisions here.
- Coordinate non-product breaking interface changes with every affected
  consumer and design compatibility, migration, and rollback before handoff.

For production implementation, hand the approved product specification, ready
UX contract when present, ready architecture or feature design, canonical
machine contracts, and observed validation evidence to `scd-dev-loop`.
