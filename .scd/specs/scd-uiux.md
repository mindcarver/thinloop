---
managed_by: scd-discovery
status: approved
---

# Outcome

Thinloop provides a composable `scd-uiux` skill that turns stable Web product
behavior into a reviewable experience contract and the smallest useful visual
evidence before production implementation.

# Users and Problem

The primary user is an individual developer using a strong coding model to
build a new Web product or a substantial interface feature. A product
specification alone does not define information architecture, screen states,
interaction feedback, responsive behavior, accessibility, or visual intent,
while heavyweight design methods make every small UI change traverse the same
pipeline.

# User Scenarios

1. A UI-heavy 0-to-1 product reaches a stable product core. UIUX designs the
   experience while architecture work can proceed independently, then names
   the shared interface needs before frontend and backend implementation.
2. A substantial existing Web journey needs interaction or visual design.
   UIUX handles that focused slice without repeating product discovery.
3. A clear copy, token, spacing, or obvious local UI change goes directly to
   Dev Loop without UX ceremony.
4. An existing UX specification or prototype is reviewed for coverage,
   consistency, responsiveness, accessibility, and implementation readiness.
5. A layout or state decision cannot be resolved reliably in prose. UIUX
   creates and inspects the smallest useful wireframe or prototype.

# Rules and Decisions

- Cover desktop and responsive mobile Web in the first version; exclude native
  mobile and desktop application design.
- Compose UIUX as an optional capability, not a mandatory global stage.
- For UI-heavy 0-to-1 work, start after Discovery stabilizes the product core
  and fold product-visible changes back into the single combined approval.
- Keep production frontend implementation in `scd-dev-loop`.
- Route trivial, already-clear UI changes directly to Dev Loop.
- Scale from an interaction delta to wireframe, lightweight prototype, or high
  fidelity according to decision risk.
- Reuse existing design systems and specify deltas instead of creating a new
  system by default.
- Let UIUX identify data, operation, state, and error needs without
  unilaterally finalizing the shared frontend-backend interface contract.
- Use one lightweight UX contract by default and link visual evidence.
- Require observed visual inspection before claiming a mockup or prototype is
  reviewed.

# Failure and Edge Cases

- If user, problem, scope, business rules, or acceptance remain materially
  open, return to Discovery rather than disguising product decisions as UX.
- If UX changes an approved product boundary, reopen only the affected
  delivery contract.
- Do not claim frontend and backend can proceed independently while their
  shared interface contract remains contradictory or ownerless.
- Do not manufacture screens to close coverage or invent backend schemas to
  complete a UX document.
- A missing design tool must not block text, wireframe, or local prototype
  alternatives.
- A generated visual that was not rendered and inspected remains unverified.

# In Scope

- Routing between direct, focused, product, and validation work.
- Web journeys, information architecture, surfaces, states, transitions,
  content behavior, responsive behavior, accessibility, and visual direction.
- Risk-adaptive wireframes, mockups, and non-production prototypes.
- Minimal durable UX contract rules and readiness review.
- Engineering interface needs and cross-artifact consistency checks.
- Skill metadata, repository documentation, contract tests, and local
  validation.

# Out of Scope

- Production frontend implementation.
- Native iOS, Android, Windows, or macOS application design.
- Backend architecture, API ownership, persistence, or deployment.
- Mandatory Figma, high-fidelity design, design systems, PRDs, architecture
  documents, stories, sprints, roles, or separate approval gates.
- Building `scd-architecture` in this delivery.

# Testing Seam

- Node contract tests inspect routing, composition, scope, artifact, visual
  evidence, engineering seam, and readiness invariants.
- Official local validators check Skill and plugin structure.
- Repository tests and documentation validators confirm existing Thinloop
  behavior remains intact.
- Real routing and design quality require fresh isolated forward tests and must
  be reported separately from static validation.

# Acceptance

- A1: Clear local UI changes route directly to Dev Loop, while substantial Web
  experience work can use Focused, Product, or Validate behavior.
- A2: UI-heavy 0-to-1 work requires a stable product core and returns
  product-contract changes to Discovery without adding a second approval.
- A3: The skill covers journeys, surfaces, states, interactions, responsive
  behavior, accessibility, visual direction, and acceptance traceability only
  where activated.
- A4: Fidelity scales from a written delta through wireframe or lightweight
  prototype to high fidelity based on decision risk, without requiring Figma.
- A5: Existing design systems are reused by default and broader visual systems
  are created only when repeated independent value justifies them.
- A6: UIUX records interface needs but does not duplicate or unilaterally
  finalize the shared frontend-backend interface contract.
- A7: Durable fallback UX work uses one `.scd/ux/<slug>.md` with `draft` and
  `ready` states, and `ready` is not a separate product approval.
- A8: Journey-to-surface closure, activated state coverage, responsive and
  accessibility behavior, visual evidence, and engineering seams are reviewed
  before a durable UX handoff becomes ready.
- A9: Production code remains in Dev Loop, generated visuals require observed
  inspection, all local validators and tests pass, and unrelated work is not
  committed.
