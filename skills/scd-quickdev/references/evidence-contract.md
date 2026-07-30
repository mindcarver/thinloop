# QuickDev evidence contract

Use this reference to select proportional verification and describe incomplete results.

## Evidence ladder

Choose the strongest practical evidence that directly exercises the change:

| Change | Minimum useful evidence | Strengthen when risk rises |
|---|---|---|
| Documentation, naming, small config | targeted static or repository check | parse/build the affected artifact |
| Local bug fix | focused regression or behavior test | relevant suite and type/build check |
| Cross-layer feature | focused tests plus integration/build evidence | runtime or end-to-end path |
| UI behavior | build plus rendered interaction or screenshot | visual comparison and logs |
| Schema, migration, auth, security | dedicated checks in a safe environment | rollback, compatibility, or adversarial cases |

Repository-specific commands outrank generic guesses. Do not invent a new test framework for a trivial change.

## Evidence quality

Evidence is useful only when it records:

- the exact check or observable action;
- whether it completed;
- the exit status or result;
- which acceptance behavior it supports.

A passing unrelated suite is not evidence for the changed behavior. A test that never reached the target path is not a regression test.

## Independent review evidence

Record the review engine, exact committed refs or workspace state, reviewable
files, and confirmed findings. Prefer `open-code-review-delegate`; when only the
CLI is available, record the completed `ocr delegate preview` and
`ocr delegate rule` commands. When OCR is unavailable or fails, record
`OCR_UNAVAILABLE` or the exact error and the manual fresh-context review
performed instead.

OCR output is candidate evidence. Confirm each finding against the actual code,
requirement context, and relevant tests before reporting it. Discard false
positives. Return:

- `REVIEW_PASS` when the independent review finds no confirmed issue that
  requires an in-scope change;
- `REVIEW_FAIL` when a confirmed correctness, security, acceptance, unintended
  change, or regression issue requires repair.

Style preferences and unsupported speculation do not fail the review. The
independent verifier never modifies product code. After `REVIEW_FAIL`, the
implementing agent repairs confirmed in-scope findings and requests a new
fresh-context review.

## Acceptance mapping

When the governing Issue assigns acceptance identifiers, retain them through implementation:

```markdown
- A1 PASS - `node --test test/import.test.mjs`
- A2 PASS - observed the oversized upload rejected before a request was sent
- A3 UNVERIFIED - the current environment cannot exercise the external model outage
```

Each identifier must map to a directly relevant check, an explicit unverified boundary, or a named blocker. One check may support several acceptance items when it genuinely exercises them; do not duplicate or inflate evidence.

If implementation reveals that an acceptance item is impossible, contradictory,
or would require a material product-contract change, do not quietly drop or
rewrite it. Update the Issue and return that decision to discovery.

Only after `REVIEW_PASS`, the independent acceptance verifier produces one
aggregate result:

- `PASS` only when every acceptance item has direct observed evidence;
- `FAIL` when changed behavior violates any acceptance item;
- `BLOCKED` when a required acceptance path cannot run.

The verifier must not promote `UNVERIFIED` or partially verified behavior to
`PASS`.

## Failures and baselines

When a check fails:

1. determine whether the failure is caused by the current change;
2. fix in-scope regressions;
3. do not silently repair unrelated baseline failures;
4. report the failing check and evidence that separates baseline from regression when available.

Limit self-repair when retries stop producing new information. Escalate a real blocker instead of cycling.

## Completion language

- **Verified:** acceptance behavior is supported by observed evidence.
- **Partially verified:** implementation exists, but a named acceptance path remains unobserved.
- **Blocked:** a required implementation or verification step cannot proceed.

Never use "done", "fixed", or "working" more broadly than the evidence permits.
