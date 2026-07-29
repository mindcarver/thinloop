# Reengineering contract

Use this contract to decide and describe a project-scale refactor or
reimplementation without turning upstream implementation details into accidental
requirements.

## Evidence authority

| Evidence | What it can establish |
|---|---|
| Approved target outcome | Desired users, behavior, boundaries, and acceptance |
| Pinned source repository | The exact implementation inspected |
| Executed source behavior | What the pinned source did under the recorded environment and fixture |
| Public machine contract | Promised API, CLI, event, file, plugin, or protocol behavior |
| Maintained source test | Intended behavior only when scope and execution result are known |
| Source code inspection | Implementation mechanism and investigation leads |
| License and notice text | Terms that require review; not an automated legal conclusion |

A README claim, passing source test, or observed behavior is not automatically
the desired target contract. Resolve conflicts explicitly.

## Pinned source record

Add this compact record to the Initiative:

```markdown
## Source baseline

- Repository: <canonical URL>
- Commit: <full immutable SHA>
- Tag or release label: <optional descriptive value>
- Retrieved: <timestamp and method>
- License files inspected: <paths at pinned SHA>
- Notices or attribution: <paths at pinned SHA>
- License conclusion: Not provided by Thinloop
- Uncertainty or required review: <none or exact blocker>
- Build/run environment: <toolchain, OS/container, dependency lock>
- Baseline commands and fixtures: <exact references>
```

Do not store credentials, tokens, private source, personal data, or large
captured outputs in the Issue.

## Compatibility envelope

Use a compact table in the Initiative. Split a capability only when its
acceptance can change independently.

```markdown
## Compatibility envelope

| ID | Capability and seam | Decision | Source evidence | Target contract | Verification | Issue |
|---|---|---|---|---|---|---|
| CAP-001 | CLI converts one input file | keep | command + fixture | exact exit and output schema | differential fixture | #123 |
| CAP-002 | Legacy admin screen | drop | observed route | none | absence from target scope | none |
| CAP-003 | Export ordering | change | integration test | stable documented order | target integration test | #124 |
| CAP-004 | Crash recovery | unverified | source would not run | pending decision | blocked | PLANNED |
```

Allowed decisions:

- `keep` - target must satisfy the stated compatibility contract;
- `change` - target intentionally differs and the approved delta is explicit;
- `drop` - target intentionally omits the capability;
- `unverified` - evidence or product decision is missing; the capability cannot
  silently become READY.

Do not use vague entries such as "same functionality" or "feature parity."

## Direction decision

Record the comparison before approval:

```markdown
## Reengineering direction

- Mode: refactor | reimplement
- Target language/framework/runtime:
- Incremental strategy: in-place | hybrid/strangler | replacement
- Why this mode is necessary:
- Evidence against the rejected direction:
- Compatibility and migration cost:
- Rollback strategy:
- Confidence:
- Unresolved risks:
```

Refactor normally wins when the current implementation can satisfy the approved
target and incremental improvement is verifiable. Reimplement may win when the
required runtime, language, deployment boundary, security model, or retained
capability subset makes continued modification more costly or unverifiable.
Neither direction wins from style preference alone.

## Initiative additions

Use the normal `scd-project` Initiative contract and add only these
reengineering-specific sections:

- Source baseline
- Reengineering direction
- Compatibility envelope
- Migration and coexistence strategy
- Differential and target-only verification
- License and attribution uncertainty
- Cutover and retirement human gates

The Initiative remains the project truth. Do not create a second local
reengineering plan or parity database.

## Delivery slicing

Prefer capability slices that can be demonstrated at an external seam. Common
nodes include:

- executable baseline or contract harness;
- shared target contract or platform foundation;
- one independently usable vertical capability;
- migration or coexistence mechanism;
- assembled integration and parity;
- cutover or old-system retirement when separately authorized.

Do not create a Delivery Issue solely for every source directory or technical
layer. A platform foundation is justified only when another slice cannot be
implemented or verified without it.

## Staged milestones

A user may approve an initial milestone that delivers only part of the
compatibility envelope. Treat that as delivery sequencing, not permission to
erase the remaining contract.

- Every deferred `keep` or `change` capability remains a visible `PLANNED` or
  `BLOCKED` graph node with its target contract and verification seam.
- A milestone may be called complete only for its explicitly approved slice.
- While any retained capability is deferred, do not claim complete rewrite,
  same product contract, full parity, or integration acceptance.
- User-facing skills, commands, documentation, and examples shipped in that
  milestone must not require an unavailable capability without an explicit
  partial-state warning and an approved usable fallback.
- The final integration Issue remains dependent on all retained leaf
  capabilities, including those assigned to a later milestone.

## Recover an unmanaged prototype

When implementation or default-branch commits already exist without the
required Initiative, graph, Issue lanes, or acceptance evidence:

1. stop adding features;
2. classify the existing code as an unmanaged candidate, not DONE;
3. audit its commits, tests, provenance, and external behavior without treating
   the implementer's summary as acceptance;
4. materialize the Initiative, compatibility envelope, Delivery Issues, and
   integration gate through `scd-project`;
5. attach existing code and test results only as candidate evidence to the
   applicable Issues;
6. run the remaining QuickDev and independent acceptance contracts from live
   Issue state.

Do not rewrite history merely to imitate the missing lanes. Recovery restores
authoritative contracts and evidence; it does not retroactively claim that the
original unmanaged execution complied.

## License and clean-room boundary

Thinloop records evidence and blockers; it does not determine whether a license
permits the intended use.

- Pin the exact license and notice files with the source commit.
- Preserve required notices only after the applicable requirement is confirmed.
- Do not remove upstream attribution to make a derivative appear original.
- If a clean-room implementation is required, define separate specification and
  implementation roles, information barriers, allowed behavioral observations,
  and provenance logs before implementation.
- Any implementation agent exposure to restricted source invalidates an
  unsupported clean-room claim; stop and report it.

## Baseline and parity evidence

For every `keep` or `change` capability, specify one or more:

- source and target command using the same sanitized fixture;
- schema-aware API, event, or file validation;
- golden output with stable-field normalization justified by contract;
- state transition or persistence check;
- target-only acceptance where source behavior is intentionally changed;
- performance or resource comparison only when the envelope activates it.

Record environment and nondeterminism. Do not hide missing parity behind
aggregate pass percentages. Every capability ends as `PASS`, `FAIL`,
`UNVERIFIED`, or `BLOCKED` with direct evidence.
