# Evidence contract

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
