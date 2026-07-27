# Trial Contract

## Approval Gate

Implementation requires all of these:

- the exact candidate is visible in the current context;
- the user explicitly approves its stable candidate ID;
- no candidate operation changed after approval;
- source authority resolves independently of approval;
- one same-root-cause batch remains in scope.

Generic agreement without the candidate ID is insufficient. Any changed operation creates a new candidate revision and requires new approval.

## Trial

Append `proposed` only after the approval gate, then append `trial` immediately before editing. Snapshot only files named by the candidate. Use `scd-dev-loop` for implementation and preserve A1–A13 from the approved specification as acceptance identifiers.

Do not improve adjacent wording, restructure unrelated instructions, reformat unrelated files, or add speculative flexibility. A trial is a causal intervention: the diff must be narrow enough that the observed outcome can be attributed to it.

## Validation

Classify every operation:

- `instruction`, `trigger`, `workflow`: behavior-changing; require relevant deterministic checks and a fresh isolated agent session using a realistic prompt that did not participate in authoring the change.
- `script`, `format`: deterministic; require focused automated tests. Add an isolated agent session only if the observable agent behavior also changes.
- `packaging`, `documentation`: require directly coupled manifest, parser, link, and content checks.

An isolated session must start after the edit, load the edited skill fresh, receive only the declared test prompt and fixture context, and produce inspectable output. A second reading in the authoring context is not independent.

Record unavailable independent validation as `trial-unverified`. Do not treat a static inspection, green build, or existing-session answer as a substitute.

## Terminal Decisions

**Accepted:** All required trial checks pass; attribution remains Thinloop skill; no acceptance regression appears. Increment exactly one patch version, synchronize every release manifest, rerun the complete promoted-state checks, and only then append `accepted`. If promotion checks fail, restore the entire batch and append `reverted`. Report that distribution remains pending.

**Reverted:** A required check fails or the candidate causes regression. Restore only candidate-owned files from the snapshot, verify restoration, and append `reverted`.

**Rejected:** The user rejects the candidate or trial. Restore trial-owned changes if any and append `rejected`.

**Trial-unverified:** Required independent behavior evidence cannot be obtained. Do not promote, patch-bump, distribute, or describe the candidate as effective.

## Version and Distribution

A formal accepted batch increments `major.minor.patch` by exactly one patch. Update all Thinloop plugin and marketplace manifests in the same batch and verify equality.

Never stage, commit, push, publish, deploy, reinstall, update an installed Skill, or write a runtime plugin cache without a separate explicit request. A successful local trial proves only the checked behavior in the authoritative source.

## Self-Evolution

A candidate targeting `scd-evolve` must cite a prior terminal history record from a different run as `source_run_id`. The prior record must predate the current proposed event.

Never use the current diagnosing conversation as both evidence and modification context for `scd-evolve`. When prior independent evidence is absent, stop before proposal implementation.
