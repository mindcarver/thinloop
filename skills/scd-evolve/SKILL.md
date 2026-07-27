---
name: scd-evolve
description: Diagnose a completed or paused development interaction and propose one evidence-graded improvement to the Thinloop skills actually used. Use only when the user explicitly asks to evolve, improve, or self-optimize Thinloop from the current conversation or a supplied transcript, or explicitly approves a previously proposed evolution candidate for implementation.
---

# SCD Evolve

Improve Thinloop through a human-approved, reversible trial. Treat conversation evidence as incomplete by default, separate skill defects from other causes, and never rewrite a skill merely because an outcome was disappointing.

## Trigger Policy

Use only when the user explicitly invokes `scd-evolve` or explicitly asks Thinloop to analyze the interaction and improve itself.

Do not invoke automatically during ordinary development, at task completion, from a hook, or because an agent notices a possible skill weakness. Do not search platform session stores or logs. Analyze only the visible interaction, its visible tool evidence, and any transcript the user deliberately supplies.

## Select the Mode

**Diagnose and propose:** Use the evidence workflow below. Make no repository write, including history, before approval.

**Implement an approved candidate:** Continue only when the current conversation contains the exact candidate and the user explicitly approves its candidate ID. Re-resolve source authority and re-check boundaries before every write.

**Resume an interrupted trial:** Read the sanitized history plus the explicit candidate retained in the current context. If the exact diff or rollback ownership is unavailable, do not reconstruct it from history; stop with `trial-unverified` or ask for the missing candidate.

## Diagnose and Propose

1. Read [diagnosis-contract.md](./references/diagnosis-contract.md).
2. Label coverage exactly `full-transcript`, `visible-context`, or `partial`.
3. List the Thinloop skills demonstrably used in the interaction. If none were used, report that there is no editable target and stop.
4. Identify observed signals and separate matched signals from relevant signals that were not observed.
5. Attribute the problem among Thinloop skill, agent, requirements, tool or environment, model limit, third-party skill, or insufficient evidence. Preserve competing explanations.
6. Propose at most one same-root-cause batch. Prefer one target skill. Multiple Thinloop targets require an explicit coupling rationale.
7. Assign a stable candidate ID such as `EVO-20260727-trigger-routing`.
8. Present the candidate using [evolution-candidate.md](./assets/evolution-candidate.md), including exact bounded add/delete/replace operations.
9. End the proposal by asking the user to approve or reject that candidate ID. Do not modify the source, history, config, version, or installed skill.

One matched signal is enough to propose a candidate. Grade it `exploratory`, `supported`, or `confirmed`; never inflate the grade to compensate for incomplete evidence.

## Implement an Approved Candidate

1. Confirm the approval names the exact candidate ID and the candidate has not changed since presentation. If either condition fails, return to proposal.
2. Read [source-and-history-contract.md](./references/source-and-history-contract.md) and [trial-contract.md](./references/trial-contract.md).
3. Resolve the authoritative Thinloop checkout from an explicit absolute override or the `thinloop_source_root` key in the user-level `.scd/config.json`:

   ```bash
   node <scd-evolve-root>/scripts/resolve-source-root.mjs
   ```

   Pass `--root <absolute-path>` for an explicit invocation override or `--config <absolute-config-path>` for tests. Never infer authority from an installed skill path or runtime plugin cache.

4. Inspect Git status and every candidate-owned file. Stop before writing if candidate files have overlapping uncommitted changes, the target is not a Thinloop Git checkout, or the resolved path is a plugin cache.
5. Prepare a sanitized `proposed` event and validate it without storing raw evidence. After the approval gate, append `proposed`, then `trial`, with:

   ```bash
   node <authoritative-root>/skills/scd-evolve/scripts/evolution-history.mjs append \
     --root <authoritative-root> \
     --record <sanitized-record.json>
   ```

   Keep the sanitized record in a temporary location outside the repository and remove it after the append result is known.

6. Snapshot only candidate-owned files in a temporary location outside the repository. Do not use broad Git restore, reset, checkout, or clean commands.
7. Hand the exact approved batch to `scd-dev-loop`. Preserve candidate ID, target skills, operations, and acceptance evidence; do not add adjacent cleanup.
8. Validate according to the change kind:
   - `instruction`, `trigger`, or `workflow`: run relevant deterministic checks and a fresh isolated agent-session forward test.
   - `script` or `format`: run relevant deterministic tests; use an isolated session only when agent behavior also changes.
   - `packaging` or `documentation`: run the directly coupled manifest, link, and content checks.
9. Decide from observed evidence:
   - pass: bump exactly one patch version, synchronize all release manifests, rerun relevant tests, then append `accepted` only if the complete promoted state passes;
   - fail: restore only candidate-owned files from the snapshot and append `reverted`;
   - required independent validation unavailable: append `trial-unverified`, keep the trial unpromoted, and report the exact gap;
   - user rejects before or during trial: append `rejected` and restore any trial-owned change.
10. Remove temporary snapshots after a verified terminal state. Report source changes, history status, version state, checks, and remaining blind spots.

Do not stage, commit, push, publish, deploy, reinstall, update runtime caches, or edit consumer-project code unless the user separately authorizes that action.

## Self-Evolution Boundary

`scd-evolve` may target itself only when a prior independent evolution run is already recorded and its run ID is named as `source_run_id`. The current diagnosing run and the source run must differ.

Never diagnose and modify `scd-evolve` within the same run. A missing prior record means self-evolution is ineligible, not merely lower confidence.

## Evidence and Privacy

Use private conversation evidence transiently. Persist only abstract signal types, a short sanitized summary, a SHA-256 fingerprint, coverage, attribution, operations, validation outcomes, and version metadata.

Never persist raw conversation text, prompts, logs, consumer-project names, absolute paths, source code, code snippets, user data, credentials, tokens, or authentication material. If redaction is needed, set `evidence_redacted: true`. If redaction removes the basis of the candidate, do not implement it.

## Resources

- [diagnosis-contract.md](./references/diagnosis-contract.md): evidence coverage, attribution, signals, and candidate grading.
- [source-and-history-contract.md](./references/source-and-history-contract.md): source authority, config, JSONL lifecycle, and privacy rules.
- [trial-contract.md](./references/trial-contract.md): approval, rollback, validation, promotion, and self-evolution.
- [evolution-candidate.md](./assets/evolution-candidate.md): diagnosis and candidate presentation template.
- `scripts/resolve-source-root.mjs`: read-only authoritative-checkout resolver.
- `scripts/evolution-history.mjs`: dependency-free history validator and atomic appender.
