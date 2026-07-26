# Experience contract

Use this reference for Focused or Product design, for durable UX artifacts, and
for readiness review. Cover activated concerns only; do not fill sections with
generic advice.

## Contract boundary

The UX contract owns how a person understands and operates the approved product
behavior:

- journeys, navigation, surfaces, and information hierarchy;
- visible states, transitions, feedback, prevention, and recovery;
- content behavior and interaction patterns;
- responsive, input, and accessibility requirements;
- feature-specific visual direction or design-system deltas;
- interface needs and traceability to product acceptance.

It does not own product scope, backend architecture, transport schemas,
persistence, deployment, or production frontend implementation. Reference
those sources instead of copying them.

## Artifact policy

For durable fallback storage, use:

```text
.scd/ux/<slug>.md
```

Start from `assets/ux-contract.md`. Allowed statuses are:

- `draft` - one or more material experience decisions remain open;
- `ready` - the readiness review passes and any remaining notes cannot change
  visible behavior or acceptance.

Use `sources` to link the relevant product specification, design system,
interface contract, research, or existing UI. Use repository-relative paths or
stable URLs. A linked product specification owns approval; `status: ready` does
not add an approval gate.

Prefer one feature UX contract. Put a shared visual system in the repository's
existing design-system home, or split one only when it is reused by multiple
deliveries and changes independently.

## Journey and surface closure

Name the actor and concrete goal. A journey should expose:

1. entry condition;
2. numbered user and system steps;
3. the decisive action or comprehension point;
4. success feedback;
5. the applicable failure or recovery path.

Create a surface inventory that maps each surface to at least one journey or
acceptance item. Then walk both directions:

- every stated need reaches a surface or an intentional non-UI outcome;
- every surface exists for a stated need;
- navigation lets the user enter, continue, recover, and leave the journey.

Do not manufacture a screen to close the table. Return a missing product
decision to Discovery.

## State and interaction contract

For each important surface or reusable component, cover only applicable states:

- initial or cold load;
- loading or submitting;
- populated or success;
- empty or zero-data;
- validation failure;
- permission denied;
- dependency or service failure;
- partial success;
- offline or stale data;
- destructive confirmation, cancellation, undo, or retry;
- focus, keyboard, hover, selected, disabled, and busy behavior.

Record transitions as `state + action -> next state + feedback`. Preserve user
input across recoverable failures unless the product rule forbids it. Make
duplicate actions, stale responses, delayed completion, and navigation during
pending work explicit when they can occur.

## Responsive and accessibility floor

For responsive Web work, state:

- content priority when width decreases;
- reflow, wrapping, overflow, and dense-data behavior;
- pointer, touch, and keyboard interaction differences;
- breakpoint behavior only where layout actually changes;
- modal, drawer, menu, table, and form behavior on narrow screens.

For accessibility, make relevant behavior testable:

- semantic structure and accessible names;
- keyboard order, operation, escape, and focus return;
- visible focus and non-color status cues;
- error association, announcements, and recovery;
- contrast targets for load-bearing combinations;
- reduced motion and zoom/reflow behavior;
- alt text or equivalent meaning for informative media.

Use WCAG terminology where it clarifies a requirement, but do not paste a
generic checklist into every contract.

## Visual and component discipline

Name the existing design system or component source when one exists. Describe
only feature-specific additions or overrides. A component contract separates:

- purpose and allowed contexts;
- content and anatomy;
- interaction and state behavior;
- visual tokens or inherited style;
- responsive and accessibility behavior.

Do not encode one-off pixel values when an existing token or layout rule
expresses the decision. Do not create a complete design system for one feature.

## Engineering seam

For each surface, list:

- information displayed;
- user operations;
- states and error distinctions the UI must receive;
- representative examples useful for mocks;
- existing shared-contract operation identifiers, when available.

Label unresolved items as `Interface need`, not as a finalized API. The shared
interface contract remains the common source for frontend and backend field,
operation, permission, and error semantics.

## Readiness review

Before setting `status: ready`, verify:

- source paths resolve and approved terminology is preserved;
- every acceptance behavior has UX coverage where it is user-facing;
- every designed surface maps back to a journey or acceptance item;
- applicable loading, empty, failure, permission, partial, and recovery states
  are explicit;
- interaction rules are internally consistent across surfaces;
- responsive and accessibility requirements are observable;
- visual references exist where prose cannot preserve a spatial or appearance
  decision;
- visual references and the written contract agree;
- interface needs have stable shared-contract references or a named
  reconciliation owner;
- no open decision can materially change visible behavior or acceptance.

If any final item fails, keep `status: draft` and report the exact blocker.
