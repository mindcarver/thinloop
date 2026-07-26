---
name: scd-uiux
description: "Design or refine a Web product's user experience and interface contract before production implementation. Use for UI-heavy 0-to-1 products after the product core is stable, substantial new screens or journeys, unclear information architecture, interaction or state behavior, responsive and accessibility decisions, visual direction, UX validation, or an explicit UI/UX design request. Use independently for focused UX work or compose it with scd-discovery and scd-dev-loop. Do not use for trivial copy, color, spacing, or obvious local UI changes; backend-only work; native mobile or desktop applications; or production frontend implementation."
---

# SCD UIUX

Make a Web experience explicit enough to review and implement without turning
every interface change into a design project. Design behavior and presentation;
leave production code to `scd-dev-loop`.

## Select the lightest sufficient path

Inspect the request and repository, then choose internally:

- **Direct:** the requested UI change and its observable result are already
  clear. Hand it to `scd-dev-loop` without UX questions or artifacts.
- **Focused:** one journey, surface, or interaction needs design. Resolve only
  that slice and preserve only the handoff it needs.
- **Product:** a UI-heavy 0-to-1 delivery needs a coherent Web experience.
  Require a stable product core, then cover the activated experience surfaces.
- **Validate:** an existing UX contract or prototype needs a read-only
  completeness, consistency, accessibility, or implementation-readiness audit.

Do not announce these path names unless the user asks about the method. A
greenfield product does not make every visual decision high fidelity, and a
small UI change does not inherit the Product path.

## Start from product and repository truth

Read applicable repository instructions, the relevant product specification,
existing UI, design system or component library, interface contracts, and
user-supplied visual references before asking questions. Inspect the running
product when practical; do not infer current behavior from filenames alone.

For the Product path, require the product core to establish the primary user,
problem, next delivery, business rules, boundaries, and observable acceptance.
Use `scd-discovery` when several of those decisions remain open. Do not recreate
the product specification inside the UX contract.

After that core is stable, UIUX may proceed in parallel with architecture work.
Neither waits for the other to finish, but both must reconcile user operations,
data, errors, permissions, and terminology through the shared interface
contract before frontend and backend implementation begins.

If UX work reveals a change to approved behavior, scope, permissions, data or
privacy boundaries, irreversible actions, or acceptance, return only that
change to `scd-discovery`. Visual and interaction choices that preserve the
approved product contract remain UX decisions.

This first version covers desktop and responsive mobile Web experiences. State
the boundary and stop when the requested result requires native iOS, Android,
Windows, or macOS platform design.

## Establish the experience slice

Identify the smallest complete user journey being designed and the acceptance
behaviors it supports. Resolve only decisions that affect:

- information architecture or navigation;
- a surface, task flow, or state transition;
- user feedback, recovery, or prevention of error;
- responsive behavior or input modality;
- accessibility or comprehension;
- a repeated visual or component rule;
- the data and operations the interface must consume.

Ask one material decision at a time only when repository evidence cannot answer
it. Give a recommendation and rationale. Propose sensible design defaults
instead of asking the user to invent every pattern, but keep product and brand
trade-offs with the user.

## Model behavior before polishing appearance

For Focused and Product work, read
`references/experience-contract.md`. Build the activated parts of the
experience:

1. key journeys and their success or recovery paths;
2. surfaces, navigation, and information hierarchy;
3. per-surface states and transitions;
4. interaction, validation, feedback, and content behavior;
5. responsive and accessibility behavior;
6. visual direction and design-system deltas;
7. engineering interface needs and acceptance traceability.

Every stated user need must land on a surface or deliberate non-UI behavior.
Every designed surface must support a named journey or acceptance behavior.
Do not add decorative screens, components, or states without a product reason.

Reuse the repository's design system and components by default. Specify only
the visual and behavioral delta. Create a broader visual system only when
several surfaces need a new, reusable language and no suitable system exists.

## Use visual artifacts when seeing changes the decision

Read `references/visual-evidence.md` before creating or validating wireframes,
mockups, or prototypes.

- Use a concise interaction delta for obvious local changes.
- Use a low-fidelity wireframe or lightweight prototype when layout,
  hierarchy, navigation, or state transitions are ambiguous.
- Use high-fidelity work only when brand, visual language, or precise component
  appearance is part of acceptance.

Do not require Figma or any single design tool. Prefer existing repository and
user tools. Keep prototypes explicitly non-production. Inspect every produced
visual at the relevant viewport sizes and extract load-bearing decisions into
the UX contract; the contract wins when a visual artifact conflicts with it.

## Reconcile the engineering seam

Record what each surface needs to display, which user operations it invokes,
the states it must distinguish, and representative examples. Reuse stable
operation and field names from an existing shared interface contract.

UIUX may propose interface needs, but it must not unilaterally finalize
endpoints, transport schemas, persistence, or backend ownership. Frontend and
backend are ready to work independently only after the relevant technical owner
has reconciled those needs into one shared interface contract.

Before handoff, check:

- every user action maps to a product rule and an interface operation or a
  deliberate client-only behavior;
- success, validation, permission, empty, partial, loading, and dependency
  failure states are representable where activated;
- terminology and identifiers do not drift between product, UX, and shared
  interface contracts;
- unresolved seam decisions are named as blockers, not hidden as UX
  assumptions.

Do not duplicate the shared interface contract in the UX artifact.

## Preserve only useful design state

Keep short discussion and clear local deltas in conversation. When repository
work needs a durable review or implementation handoff, prefer an existing
design documentation home. Otherwise create one `.scd/ux/<slug>.md` from
`assets/ux-contract.md`.

Use `status: draft` while material UX decisions remain and `status: ready`
after the readiness review. `ready` means the UX work is coherent; it is not a
second product approval. When the UX belongs to Discovery, the linked delivery
specification carries the user's one combined approval.

Keep one UX contract by default. Link visual artifacts rather than restating
them. Split out a visual system only when it is reused across deliveries and
evolves independently. Do not create PRDs, frontend architecture documents,
stories, sprint state, or implementation plans.

## Review readiness and hand off

Read `references/experience-contract.md` before setting a durable UX contract
to `ready` or declaring an existing design implementable. Report only real
gaps. A handoff is ready when:

- journey-to-surface coverage closes;
- activated states, transitions, failure, and recovery behavior are explicit;
- responsive and accessibility requirements are testable;
- visual references cover the places where layout or appearance carries a
  decision;
- engineering interface needs are reconciled or clearly assigned to the
  shared-contract step;
- no open item can materially change visible behavior or acceptance.

For a Discovery composition, return the ready UX conclusions and any
product-contract changes for the single combined approval. For production
implementation, hand the approved product contract, ready UX contract, visual
references, and shared interface contract to `scd-dev-loop`. Do not implement
production frontend code in this skill.
