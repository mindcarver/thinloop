---
managed_by: scd-discovery
status: approved
---

# Outcome

Thinloop provides a user-invoked `scd-evolve` skill that diagnoses the current development conversation, proposes evidence-graded improvements to Thinloop skills used in that conversation, and applies one approved, reversible evolution batch to the authoritative Thinloop source.

# Users and Problem

The primary user develops with Thinloop across coding agents. A completed interaction can expose weak triggers, unclear instructions, missing workflow steps, or ineffective verification. Those signals are valuable, but automatically rewriting skills from incomplete conversation evidence would create attribution errors, privacy leakage, and uncontrolled drift.

# Main Journey

1. The user explicitly invokes `scd-evolve` after a development interaction.
2. The agent identifies the available evidence and labels coverage as `full-transcript`, `visible-context`, or `partial`.
3. The agent lists the Thinloop skills actually used, diagnoses the primary source of each issue, and distinguishes skill defects from agent, requirement, tool or environment, model-limit, and third-party-skill causes.
4. For any supported signal, the agent may propose one bounded evolution candidate with a candidate ID, evidence grade, counter-evidence, attribution risk, and an exact add/delete/replace diff.
5. The user approves or rejects that candidate by ID.
6. Only after approval, the agent resolves the explicitly configured authoritative Thinloop source, records a trial event, applies the batch, and validates it.
7. The agent accepts, reverts, or marks the trial unverified based on observed evidence. A formal acceptance increments the patch version and synchronizes every release manifest.

# Decisions

- Invoke only when the user explicitly asks; never run from hooks, background monitoring, ordinary development, or session completion.
- Analyze the current visible conversation and tool evidence or a transcript explicitly supplied by the user. Do not discover or read platform session stores automatically.
- Limit editable targets to Thinloop skills actually used in the analyzed interaction.
- Allow one observed signal to produce a candidate, but grade it as `exploratory`, `supported`, or `confirmed`.
- Diagnose non-Thinloop causes, but never edit an agent, platform, model, environment, or third-party skill.
- Require candidate-ID approval before modifying authoritative source.
- Apply one same-root-cause batch at a time. Prefer one skill; include multiple Thinloop skills only when their changes are inseparable.
- Resolve authoritative source from an explicit invocation override or `thinloop_source_root` in the user-level `.scd/config.json`.
- Refuse runtime plugin caches and any directory that is not a Thinloop Git checkout.
- Persist only sanitized, abstract evolution events in `.scd/evolution/history.jsonl`; never persist raw conversations, consumer-project names, absolute paths, code snippets, user data, or secrets.
- Keep an append-only lifecycle of `proposed`, `trial`, `accepted`, `rejected`, `reverted`, or `trial-unverified`.
- Require a fresh isolated agent session for instruction, trigger, or workflow behavior changes. Deterministic scripts and formats may use automated tests without a model session.
- Revert a failed trial without overwriting unrelated work. If required independent validation is unavailable, mark `trial-unverified` and do not promote.
- Allow `scd-evolve` to improve itself only from a prior independent evolution record; never edit itself during the same run that generated the diagnosis.
- A formally accepted batch increments the patch version and synchronizes every release manifest. It never commits, pushes, publishes, deploys, reinstalls, or updates a runtime cache automatically.

# Candidate Signals

Any one of these can justify a graded candidate:

- The skill was not invoked when its documented trigger clearly matched.
- The skill was invoked when its documented trigger did not match.
- The agent repeatedly asked for information the conversation or skill already supplied.
- The skill caused a workflow dead end, unsafe action, privacy risk, scope expansion, or unverifiable completion claim.
- The user had to correct the skill-driven behavior.
- The same skill instruction produced a reproducible failure in an isolated replay.
- A deterministic skill script or output contract failed a reproducible test.

# Failure Behavior

- If conversation coverage is incomplete, continue with an explicit coverage label and lower confidence; do not imply a full-session audit.
- If no Thinloop skill was used, report that no editable target exists.
- If attribution is ambiguous, preserve competing explanations and propose no write beyond an exploratory candidate.
- If authoritative source is missing, invalid, dirty in overlapping files, or located in a runtime cache, stop before applying and return the candidate patch.
- If a trial fails, restore only the batch-owned changes and append a `reverted` event.
- If history validation fails, do not append or promote.

# Out of Scope

- Automatic monitoring, completion hooks, platform log adapters, or hidden session-store access.
- Editing third-party skills, agent rules, model configuration, environment configuration, or consumer-project code.
- Multiple unrelated candidates in one implementation batch.
- Persisting raw transcripts, prompts, logs, code excerpts, absolute paths, project names, or personal data.
- Large evolutionary optimizers, population search, GEPA, SkillOpt, autonomous publishing, or autonomous installation.

# Acceptance

- A1: Ordinary development and session completion never implicitly invoke `scd-evolve`.
- A2: Every diagnosis labels evidence coverage as `full-transcript`, `visible-context`, or `partial`.
- A3: Every candidate states target skill, attribution, evidence, confidence grade, counter-evidence, and possible misattribution.
- A4: Any one supported signal may produce an `exploratory`, `supported`, or `confirmed` candidate with a bounded add/delete/replace diff.
- A5: One implementation run applies only one same-root-cause evolution batch.
- A6: No authoritative source file changes before the user approves an exact candidate ID.
- A7: Writes target only an explicitly resolved authoritative Thinloop Git checkout and never a runtime plugin cache.
- A8: Behavior changes pass a fresh isolated-session forward test; deterministic scripts and formats pass relevant automated tests.
- A9: Failed trials are safely reverted without overwriting unrelated changes.
- A10: Self-evolution uses a prior independent evolution record and never edits `scd-evolve` during the diagnosing run.
- A11: Evolution history validates against the shared schema and contains none of the prohibited persisted data.
- A12: A promoted batch increments the patch version, synchronizes every release manifest, and leaves all relevant tests passing.
- A13: No commit, push, publish, deployment, runtime-cache update, or reinstall occurs without separate user authorization.

# Verification Seams

- Node contract tests inspect explicit routing, evidence grading, approval gates, source-root rules, batch limits, self-evolution, validation policy, and prohibited actions.
- A machine-readable JSON Schema and deterministic history tool validate event shape, lifecycle transitions, and persisted-data restrictions.
- Temporary-checkout tests verify source-root acceptance and cache rejection without touching installed plugins.
- A fresh isolated agent process evaluates at least one behavior-changing candidate before promotion.
- Existing plugin and cross-platform compatibility tests verify the seventh skill and synchronized patch version.
