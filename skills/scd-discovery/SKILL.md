---
name: scd-discovery
description: "Turn an underdefined product idea into an explicitly approved, testable product or delivery contract before implementation. Use by default for a new product, application, plugin, service, or system; for a substantial feature with multiple dependent product decisions; or when data ownership, permissions, irreversible behavior, public interfaces, or external integrations remain undecided. Approved greenfield products receive a lightweight `.scd/product/prd.md`; clear isolated changes and bugs remain Issue-only. Also use when the user explicitly asks to clarify, challenge, or specify a product idea. Do not use for a clear local change with an observable outcome, boundary, and acceptance path; one isolated ambiguity can be clarified without full discovery. When the approved outcome spans multiple independently verifiable deliveries, hand project decomposition to scd-project instead of forcing one oversized Issue."
---

# SCD Discovery

Resolve consequential product decisions before implementation without turning
discovery into a fixed ceremony. For greenfield work, define the approved MVP
product baseline. For an existing product, cover the next coherent delivery,
not the product's entire future.

Do not edit implementation code during full discovery. A user must explicitly approve the combined product contract before implementation begins.

## Select the lightest sufficient path

Inspect the request and available repository context, then choose internally:

- **Direct:** outcome, boundary, and observable acceptance are already clear. Hand implementation to `scd-quickdev` without discovery artifacts or extra questions.
- **Clarify:** one answer can make the work executable. Ask that one material question, then hand off.
- **Discovery:** multiple dependent product decisions or a high-cost product boundary is unresolved. Follow the full workflow below.

Treat greenfield products, applications, plugins, services, and systems as
Discovery by default. Their approved result is a lightweight product PRD, not
only an implementation Issue. If the user supplies a complete Issue or product
contract, use the readiness fast path rather than manufacturing questions.

When one approved outcome clearly requires several independently verifiable
deliveries, stabilize the shared project core and hand decomposition to
`scd-project`. Do not collapse a project into one Issue containing unrelated
delivery checklists.

Do not announce these path names unless the user asks about the method.

## Investigate before asking

Read applicable repository instructions, existing Issues, architecture notes, tests, and relevant implementation before interviewing. Discover facts from the environment instead of asking the user to recall them.

Keep facts, user decisions, working assumptions, and deferred decisions distinct. Research external standards or referenced products only when a current fact could materially change the decision; do not generate market or competitor analysis by default.

## Establish the delivery slice

For a new product, use at most two opening decisions to establish:

- the primary user;
- the problem or current workaround;
- the observable change the user wants.

Challenge an unconfirmed solution assumption when it may solve the wrong problem. Give the concern and a recommendation once. When the user confirms the product form is fixed, accept it as a constraint and continue.

Define the next complete, independently verifiable delivery. Keep longer-term ideas visible only as deferred or out of scope.

For a greenfield product, stabilize the MVP before slicing delivery:

- product vision, primary users, and the problem or current alternative;
- MVP goals, non-goals, and core user journeys;
- observable functional requirements with stable `FR-*` identifiers;
- important rules, failure cases, data, permissions, and integrations;
- measurable success criteria, assumptions, risks, and open questions.

Do not expand the PRD into roadmap theater, implementation tasks, architecture,
or a speculative future backlog.

If the user's requested outcome cannot be represented as one coherent delivery
without hiding several independent acceptance boundaries, stop slicing at the
shared project core. Confirm that core, then let `scd-project` create the
Initiative and Delivery Issue DAG. Discovery does not plan implementation work
or run a project execution loop.

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

A skipped or non-substantive answer to an interview question is not a
rejection. Treat the strongest recommendation as a provisional assumption, name
it, and continue dependent work; confirm accumulated assumptions at the final
contract approval. See `references/interviewing.md` → When a decision comes
back unanswered. This mirrors the approval-stage silence rule (below) so the
interview stage is not asymmetrically unguided.

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
6. for greenfield work, confirm the PRD has no product-blocking open question,
   its `FR-*` identifiers are unique and stable, and its success metrics are
   observable;
7. present one compact shared-understanding summary;
8. request one explicit approval of the combined contract.

Silence, topic changes, partial agreement, or the model's confidence are not approval. A clear affirmative response to the approval request is approval. If the user changes the contract, revise it and review again.

Read `references/readiness-review.md` before declaring the contract ready.

## Persist the approved contract and hand off

For an approved greenfield product requested as repository work:

1. create or update `.scd/product/prd.md` from
   `assets/product-prd.md`;
2. set `status: approved`, increment `version` for a material product-contract
   change, record `approved_at`, and keep stable `FR-*` identifiers;
3. use the repository's ordinary low-risk document-delivery path so the
   approved version is reachable from the default branch before Project marks
   delivery nodes READY or QuickDev starts product implementation;
4. treat the PRD as authoritative for product-level why, users, problem, MVP
   scope, requirements, and success metrics.

Do not keep a permanent draft PRD. Before approval, use conversation or the
temporary Discovery continuity state. If the approved PRD cannot be made
reachable from the default branch, report that downstream work is blocked
instead of treating an uncommitted local file as shared product truth.

When the user requested repository work for one delivery, present the converged
contract for explicit approval, then create or update one detailed GitHub
Issue. For a clear change to an existing product, that Issue is the sole
requirement and acceptance source of truth. For a greenfield product, the PRD
owns the product baseline while the Delivery Issue owns the next slice's
boundary, acceptance, and verification seams. Reference the PRD path, approved
version, and implemented `FR-*` identifiers without copying the full PRD into
the Issue.

For an approved multi-delivery project, hand the shared project contract to
`scd-project` instead. Project owns the Initiative and Delivery Issue graph;
Discovery must not create one oversized implementation Issue first.

If GitHub or the repository's authoritative tracker is unavailable, report the
blocker instead of silently substituting `.scd/specs/`. If the user approves
but does not want implementation, remove temporary discovery state and stop
after creating the Issue. If the user approves implementation, hand the Issue
to `scd-quickdev`. Do not add separate approval gates for architecture, task
breakdown, or implementation unless a later choice would change the approved
product contract.

When the user asked only to discuss an idea, keep the result in conversation
unless they request a file. Discussion alone does not authorize creating or
approving a repository PRD.

## Resources

- `references/interviewing.md` - decision-tree questioning, depth control, and research discipline.
- `references/readiness-review.md` - fast path, adversarial review, and explicit approval semantics.
- `references/artifacts.md` - temporary state, GitHub Issue schema, technical documents, and change handling.
- `assets/product-prd.md` - minimum greenfield PRD template.
