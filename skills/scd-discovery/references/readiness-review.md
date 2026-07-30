# Readiness and approval

Use this reference before moving a full discovery from exploration to review.

## Readiness gate

The next delivery is ready for review only when:

- the primary user, problem, and observable outcome are coherent;
- the main journey can be described from trigger to result;
- important failure and recovery behavior is decided;
- in-scope and out-of-scope behavior is explicit;
- no open decision can materially change the delivery contract;
- deferred decisions do not block implementation;
- every acceptance item is observable through a named verification seam;
- shared terms do not carry conflicting meanings.

Readiness applies to the next delivery, not the product's entire future.

For a greenfield product, the approved MVP baseline is also ready only when:

- every required PRD section has concrete content;
- functional requirements have unique, stable `FR-*` identifiers;
- success metrics are observable without prescribing implementation;
- open questions contain no item that can materially change the MVP contract;
- the proposed first delivery or Project handoff can name the requirements it
  implements.

## Silent adversarial review

Before presenting the contract, look for:

- vague words such as fast, intuitive, robust, support, secure, or smart without observable meaning;
- a happy path with no failure, empty, duplicate, cancel, or recovery behavior;
- conflicting confirmed decisions;
- model assumptions written as user decisions;
- missing ownership, privacy, permission, deletion, or retention rules;
- hidden dependencies that expand the delivery;
- acceptance items that prescribe implementation but cannot verify user behavior;
- acceptance items with no practical evidence path;
- irreversible or vendor-locking choices hidden as implementation details.

Do not display a ceremonial checklist. If the review finds a real blocker, return to the single most upstream decision.

## Acceptance quality

Give acceptance items stable identifiers:

```markdown
- A1: A valid PDF up to 10 MB can be imported.
- A2: An oversized PDF is rejected before upload with the limit shown.
- A3: Every generated answer links to at least one source passage.
```

An item should identify observable behavior, not a task such as "implement parser" or "add tests."

## Existing-Issue fast path

When the user supplies an existing GitHub Issue or product contract:

1. inspect repository facts and the Issue;
2. run the readiness and adversarial reviews;
3. ask only about material gaps or contradictions;
4. if none remain, present the compact shared-understanding summary immediately.

If the user already approved the Issue and explicitly requested implementation,
that instruction can satisfy the approval requirement. Do not ask them to
approve the same contract twice.

## Approval request

Present:

- outcome;
- core journey;
- consequential decisions;
- explicit exclusions;
- acceptance summary;
- deferred decisions and accepted assumptions.

Then ask one question: whether this combined contract is accurate and approved.

Only a clear affirmative answer authorizes persistence of the approved
contract. For greenfield repository work, persist the approved PRD through the
repository's normal document-delivery path and then create the applicable
Delivery Issue or Project handoff. For an existing-product delivery, persist
the approved contract to the GitHub Issue. If the user approves but says not to
implement, persist only the approved artifacts they requested, clean temporary
state, and stop.
