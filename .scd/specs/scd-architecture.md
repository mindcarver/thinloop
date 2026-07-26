---
managed_by: scd-discovery
status: approved
---

# Outcome

Thinloop provides a composable `scd-architecture` skill that turns stable
product behavior into a coherent domain and system design plus validated shared
machine contracts before production implementation.

# Users and Problem

The primary user is an individual developer using a strong coding model to
build a 0-to-1 product or evolve an existing system. UIUX and a product
specification do not assign business invariants, component responsibilities,
data ownership, trust boundaries, transactions, failure behavior, or shared
interface semantics, while heavyweight architecture methods impose the same
documents and gates on clear local changes.

# User Scenarios

1. A 0-to-1 product has an approved product core. Architecture models its
   domain, system boundaries, and shared contracts while UIUX can proceed in
   parallel.
2. An existing system adds a feature with cross-module, transaction,
   concurrency, integration, migration, or rollback risk. Architecture records
   only the necessary delta.
3. A clear local change fits existing boundaries and contracts. It goes
   directly to Dev Loop without architecture ceremony.
4. A shared frontend-backend or service boundary needs design. Architecture
   coordinates one canonical machine-readable contract and validates it with a
   real format-aware tool.
5. Existing architecture or contracts need a read-only coherence,
   compatibility, or readiness audit.

# Rules and Decisions

- Provide Direct, Focused, Product, Evolution, and Validate behavior.
- Keep domain modeling, system architecture, and interface design in one
  composable Skill for the first version.
- Treat approved product specifications as the authority for business
  behavior; Architecture translates but does not invent business rules.
- Allow Architecture and UIUX to proceed in parallel after the product core
  stabilizes, then reconcile through a shared interface contract.
- Keep the ordinary domain model in `.scd/architecture.md`; split
  `.scd/domain.md` only when business lifecycle, ownership, permissions, audit,
  cross-entity consistency, synchronization, settlement, or migration becomes
  independently complex.
- Prefer repository-native contract locations and formats; otherwise use a
  visible root `contracts/` directory.
- Require any boundary used for independent implementation to have one
  machine-readable canonical contract that passes a real format-aware check.
- Use `.scd/designs/<feature>.md` for consequential feature-local design and
  update `.scd/architecture.md` only for durable system boundary changes.
- Use `draft` and `ready` without a fixed human approval gate; request decisions
  only for expensive or irreversible choices.
- Permit isolated non-production technical spikes, but no production code,
  migration execution, infrastructure mutation, or deployment.

# Failure and Edge Cases

- Missing product behavior returns to Discovery rather than becoming an
  architecture assumption.
- Changed interaction behavior returns to UIUX.
- A valid-looking YAML or JSON file is not ready unless an appropriate parser,
  linter, compiler, generator, or consumer check actually runs.
- Interface Markdown may preserve rationale but cannot be the ready contract
  for independent implementation.
- An existing system is not rewritten to explain one endpoint or feature.
- A breaking internal interface still requires affected-consumer,
  compatibility, rollout, migration, and rollback analysis.
- If validation tooling is unavailable, the affected artifact remains `draft`
  and the missing evidence is reported.

# In Scope

- Domain modeling, system boundaries, data ownership, trust and transaction
  boundaries, runtime and data flow, activated non-functional requirements,
  shared interface design, compatibility, migration, rollout, and rollback.
- Risk-adaptive baseline, feature-delta, domain, and machine-contract artifacts.
- Architecture readiness review and isolated technical feasibility spikes.
- Composition with Discovery, UIUX, and Dev Loop.
- Skill metadata, repository documentation, contract tests, official
  validation, and isolated forward tests.

# Out of Scope

- Separate domain-design or API-design Skills.
- Product discovery, interaction or visual design.
- Production business code, real data migration, live infrastructure changes,
  deployment, sprint planning, roles, or mandatory ADRs.
- Requiring OpenAPI or another specific format when the repository has a
  stronger working convention.

# Testing Seam

- Node contract tests inspect routing, composition, ownership, artifact
  thresholds, machine-contract readiness, evidence, and handoff invariants.
- Official local validators check Skill and plugin structure.
- Repository tests confirm existing Thinloop behavior remains intact.
- Isolated forward tests exercise one clear direct change and one 0-to-1 or
  evolution design response without modifying production files.

# Acceptance

- A1: Clear local work routes directly to Dev Loop, while Focused, Product,
  Evolution, and Validate cover consequential architecture work.
- A2: Product specifications remain authoritative for business behavior, and
  missing or changed product decisions return to Discovery.
- A3: UIUX and Architecture can proceed in parallel after the product core is
  stable and reconcile one shared interface contract before independent
  implementation.
- A4: The ordinary domain model stays in `.scd/architecture.md`; only activated
  complexity justifies `.scd/domain.md`.
- A5: Existing systems receive feature-local deltas by default, while the
  architecture baseline changes only for durable responsibilities, ownership,
  runtime, trust, or cross-cutting boundaries.
- A6: Repository-native machine contract locations are preferred; the fallback
  is root `contracts/`.
- A7: A shared boundary cannot become ready until its canonical contract is
  machine-readable and passes an observed format-aware check with activated
  semantics and examples.
- A8: Architecture artifacts use `draft` and `ready` without a fixed approval
  gate, and expensive or irreversible choices are confirmed when encountered.
- A9: Isolated technical spikes are allowed, but production code, real
  migrations, infrastructure mutation, and deployment remain in Dev Loop or
  explicitly authorized operational work.
- A10: Discovery, UIUX, and Dev Loop consume the architecture handoff
  consistently; all local tests and validators pass; unrelated work is not
  committed.
