---
name: scd-discovery
description: "Turn an underdefined product idea into an explicitly approved, testable delivery specification before implementation. Use by default for a new product, application, plugin, service, or system; for a substantial feature with multiple dependent product decisions; or when data ownership, permissions, irreversible behavior, public interfaces, or external integrations remain undecided. Also use when the user explicitly asks to clarify, challenge, or specify a product idea. Do not use for a clear local change with an observable outcome, boundary, and acceptance path; one isolated ambiguity can be clarified without full discovery. When an existing specification is already complete, audit it and take the fast path instead of repeating the interview."
---

# SCD Discovery

Resolve consequential product decisions before implementation without turning discovery into a fixed ceremony. Cover the next coherent delivery, not the product's entire future.

Do not edit implementation code during full discovery. A user must explicitly approve the combined product contract before implementation begins.

## Select the lightest sufficient path

Inspect the request and available repository context, then choose internally:

- **Direct:** outcome, boundary, and observable acceptance are already clear. Hand implementation to `scd-dev-loop` without discovery artifacts or extra questions.
- **Clarify:** one answer can make the work executable. Ask that one material question, then hand off.
- **Discovery:** multiple dependent product decisions or a high-cost product boundary is unresolved. Follow the full workflow below.

Treat greenfield products, applications, plugins, services, and systems as Discovery by default. If the user supplies a complete specification, use the readiness fast path rather than manufacturing questions.

Do not announce these path names unless the user asks about the method.

## Investigate before asking

Read applicable repository instructions, existing specifications, architecture notes, tests, and relevant implementation before interviewing. Discover facts from the environment instead of asking the user to recall them.

Keep facts, user decisions, working assumptions, and deferred decisions distinct. Research external standards or referenced products only when a current fact could materially change the decision; do not generate market or competitor analysis by default.

## Establish the delivery slice

For a new product, use at most two opening decisions to establish:

- the primary user;
- the problem or current workaround;
- the observable change the user wants.

Challenge an unconfirmed solution assumption when it may solve the wrong problem. Give the concern and a recommendation once. When the user confirms the product form is fixed, accept it as a constraint and continue.

Define the next complete, independently verifiable delivery. Keep longer-term ideas visible only as deferred or out of scope.

When that delivery is UI-heavy and its journey, surfaces, states, responsive
behavior, accessibility, or visual direction remain design-bearing, compose
with `scd-uiux` after the product core stabilizes. Bring product-visible UX
decisions back into the same combined contract and approval. Do not invoke
UIUX for clear local interface changes.

When that delivery creates a system or changes a durable component, data owner,
trust boundary, public contract, event, or integration, compose with
`scd-architecture` after the product core stabilizes. UIUX and Architecture may
then proceed in parallel. Reconcile their operations, data, errors,
permissions, and terminology into one shared machine-readable contract before
independent frontend and backend implementation. Do not invoke Architecture
for a clear local change that fits existing boundaries and contracts.

## Interview through the decision tree

Ask one decision at a time. Include the reason it matters now, a recommendation with rationale, and only meaningful alternatives. Resolve upstream decisions before asking downstream questions.

Expand only the branches activated by the product: user journey, rules and states, failure and recovery, data lifecycle, permissions, integrations, constraints, non-goals, and observable verification.

After three to five consequential decisions, give a short convergence summary of confirmed decisions, assumptions, exclusions, and the next unresolved branch. Do not demand approval at every checkpoint.

Read `references/interviewing.md` when full discovery begins.

## Preserve continuity only when needed

Keep short discovery in conversation. Do not create a file merely because the skill triggered.

When the discussion may cross a session or compaction, contains several dependent decisions, has multiple acceptance paths, or the user pauses, store only the resumable delta in `.scd/tasks/current.md` with `managed_by: scd-discovery`. Maintain at most one current task per worktree.

Read `references/artifacts.md` before creating, updating, promoting, or removing discovery state.

## Review readiness and request approval

When no high-impact branch appears open:

1. run the readiness and contradiction review silently;
2. bring only real blockers back into the interview;
3. identify the external seam through which each acceptance behavior will be verified;
4. when UIUX was activated, require its experience handoff to be ready and name
   any shared-interface reconciliation still required before implementation;
5. when Architecture was activated, require its baseline or feature design and
   shared machine-readable contract to be ready;
6. present one compact shared-understanding summary;
7. request one explicit approval of the combined contract.

Silence, topic changes, partial agreement, or the model's confidence are not approval. A clear affirmative response to the approval request is approval. If the user changes the contract, revise it and review again.

Read `references/readiness-review.md` before declaring the specification ready.

## Persist the approved contract and hand off

When the user requested repository work, synthesize the converged contract into `.scd/specs/<slug>.md` with `status: review`; after explicit approval, change it to `status: approved`.

If the user approves but does not want implementation, remove temporary discovery state and stop. If the user approves implementation, hand the approved specification to `scd-dev-loop`. Do not add separate approval gates for architecture, task breakdown, or implementation unless a later choice would change the approved product contract.

When the user asked only to discuss an idea, keep the result in conversation unless they request a file.

## Resources

- `references/interviewing.md` - decision-tree questioning, depth control, and research discipline.
- `references/readiness-review.md` - fast path, adversarial review, and explicit approval semantics.
- `references/artifacts.md` - temporary state, specification schema, medium-project documents, and change handling.
