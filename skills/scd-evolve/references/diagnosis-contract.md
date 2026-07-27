# Diagnosis Contract

## Coverage

Choose exactly one label:

- `full-transcript`: the user deliberately supplied the complete interaction and the transcript boundaries are explicit.
- `visible-context`: the agent can inspect the current visible conversation and visible tool results, but cannot prove that it is the complete session.
- `partial`: the user supplied excerpts, compaction omitted relevant detail, or important tool or execution evidence is unavailable.

Do not call ordinary visible context a full transcript. State the missing evidence and how it limits attribution.

## Editable Target

A Thinloop skill is editable only when the interaction shows that the skill was loaded, explicitly invoked, or its instructions were quoted and followed. A skill merely installed or mentioned is not demonstrably used.

If a non-Thinloop skill, agent rule, tool, environment, model, or requirement caused the problem, diagnose it but exclude it from candidate operations.

## Signals

One signal may support a candidate:

- documented trigger clearly matched but the skill was not invoked;
- skill was invoked although its documented trigger did not match;
- the agent repeatedly requested information already available in the interaction or skill;
- skill instructions led to a dead end, unsafe action, privacy risk, scope expansion, or unverifiable completion claim;
- the user corrected skill-driven behavior;
- an isolated replay reproduced the instruction failure;
- a deterministic skill script or format failed a reproducible test.

For every candidate, list both matched signals and relevant unmatched signals. Unmatched signals are counter-evidence, not empty ceremony.

## Attribution

Select one primary attribution:

- `thinloop-skill`
- `agent`
- `requirements`
- `tool-environment`
- `model-limit`
- `third-party-skill`
- `insufficient-evidence`

State the causal chain supported by evidence, then state the strongest plausible misattribution. Observation alone does not prove causality. A user correction is strong evidence of a behavior problem but may not identify its source.

Only a Thinloop-skill attribution can reach `accepted`. Ambiguous evidence may still produce an exploratory candidate, but not an implemented trial unless the candidate change is explicitly framed as testing the causal hypothesis.

## Candidate Grade

- `exploratory`: one plausible signal with meaningful missing evidence or competing causes.
- `supported`: multiple consistent observations or one reproducible observation with limited counter-evidence.
- `confirmed`: a fresh isolated replay or deterministic failing test reproduces the skill-caused behavior and the proposed change removes it without regression.

Do not use frequency as a substitute for controlled evidence. A single reproducible failure can be stronger than repeated unstructured frustration.

## Candidate Shape

One candidate contains:

- stable candidate ID;
- coverage label;
- one root cause;
- one or more Thinloop target skills actually used;
- coupling rationale when more than one target is necessary;
- candidate grade;
- matched and unmatched signals;
- primary attribution, evidence, counter-evidence, and possible misattribution;
- bounded `add`, `delete`, or `replace` operations with repository-relative files and exact intended text or behavior;
- planned validation and rollback ownership.

Propose one same-root-cause batch. Do not bundle unrelated improvements, speculative cleanup, version upgrades, or adjacent documentation repair unless directly coupled to the candidate.
