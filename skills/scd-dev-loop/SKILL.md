---
name: scd-dev-loop
description: "Apply lightweight delivery contracts whenever Codex is asked to change a repository: implement an approved feature, fix a bug, refactor code, change configuration, perform a migration, or resume unfinished implementation work. Keep intent scoped, require observed verification before completion claims, and preserve minimal continuity state only for work that may outlive the current context. Hand underdefined greenfield products and changes with multiple dependent product decisions to scd-discovery, and consequential unresolved technical boundaries to scd-architecture, before editing. Do not trigger for advice-only questions, explanations, or read-only reviews unless the user also asks for changes."
---

# SCD Dev Loop

Assume the model can plan and implement. Enforce outcomes, not a fixed process.

Maintain three contracts:

- scope must be clear enough to act without inventing product decisions;
- completion claims must match observed evidence;
- unfinished high-risk work must be resumable.

Keep these contracts invisible on clear, local tasks. Do not announce modes or create process artifacts unless risk requires escalation.

## Start from repository truth

1. Read applicable `AGENTS.md` files and nearby repository instructions.
2. Inspect the working tree and preserve unrelated user changes.
3. Reuse existing documentation, tests, naming, and implementation patterns.
4. Search and read targeted code before proposing a new abstraction.
5. Resume an existing SCD Dev Loop task note before starting overlapping work.
6. When the request follows discovery, read the relevant `.scd/specs/<slug>.md` and require `status: approved`.
7. When the request follows UIUX, read the relevant `.scd/ux/<slug>.md`, require
   `status: ready`, inspect its retained visual references, and use the shared
   interface contract rather than treating UX interface needs as an API.
8. When the request follows Architecture, read the relevant
   `.scd/architecture.md` or `.scd/designs/<feature>.md`, require `status:
   ready`, and parse the canonical machine-readable contracts with the same
   format-aware evidence used by their producers.

Do not generate a project wiki. Do not introduce PRDs, roles, command suites, worktrees, subagents, or TDD merely to satisfy this skill.

## Satisfy the scope contract

Derive the requested outcome, meaningful boundary, and observable acceptance behavior from the prompt and repository.

Proceed without an extra question when a reasonable interpretation preserves product behavior and repository conventions. Ask one concise question only when different answers would materially change user-visible behavior, architecture, data, security, compatibility, or external impact.

For a new product, application, plugin, service, or system, or when several dependent product decisions remain open, use `scd-discovery` before implementation. Do not turn one isolated ambiguity into full discovery. An existing complete and explicitly approved specification takes the fast path.

Treat an approved specification as the product contract. Do not silently expand it or replace user decisions with implementation preferences. If implementation evidence requires a change to outcome, visible behavior, scope, data or privacy boundaries, permissions, irreversible actions, or acceptance, return the affected contract to discovery and obtain approval again. Handle reversible implementation choices autonomously.

Treat a ready UX contract as the experience handoff, not as product approval or
frontend architecture. If it is draft, contradicts the approved product
contract, conflicts with retained visuals, or depends on an unreconciled shared
interface decision, return only that gap to UIUX or the relevant architecture
work before implementation.

Treat a ready architecture or feature design as the technical handoff, not as a
second product approval or permission to override the repository. If it is
draft, contradicts the approved product or UX contract, or names a canonical
contract that cannot be parsed, return only that gap to `scd-architecture`
before implementation.

Read `references/scope-contract.md` when ambiguity or scope expansion is plausible.

## Make the smallest coherent change

- Implement directly when the path is clear.
- Use a short plan only for dependent work that benefits from one.
- Follow existing tests and architecture unless they cause the defect.
- Keep unrelated cleanup outside the task.
- Do not commit, push, publish, deploy, migrate live data, or perform another high-impact external action unless the user requested it.

Escalate process only after evidence reveals actual risk.

## Satisfy the evidence contract

Before claiming success, run the strongest practical evidence for the changed behavior. Prefer:

1. focused behavior or regression tests;
2. relevant typecheck, lint, build, or broader tests;
3. runtime, API, or UI exercise with observable output;
4. static inspection only when execution is unavailable.

Inspect the exit code and meaningful output. Do not treat launching a command, creating a file, or predicting behavior as proof.

When an approved specification numbers acceptance items such as `A1`, preserve those identifiers in tests or the delivery report. Map every item to observed evidence, `UNVERIFIED`, or a named blocker. Never use an unrelated passing check as evidence for an acceptance item.

If verification is blocked, state what ran, the blocker, what remains unverified, and the safest next check. Use a partially verified or blocked outcome instead of saying the work is fully done.

Read `references/evidence-contract.md` when selecting checks or reporting incomplete evidence.

## Satisfy the continuity contract

Use durable state only when at least one strong signal exists:

- the task will likely cross a session or context compaction;
- it has multiple independent acceptance paths across subsystems;
- a consequential decision must survive handoff;
- the user pauses the work or asks to resume partial work.

Prefer an existing issue, plan, or project task document. When none is suitable, create `.scd/tasks/current.md` from `assets/current-task.md`. Maintain at most one fallback task note per worktree.

Before stopping or compaction, keep its status, evidence, and single next action current. The bundled hook checks this mechanically.

On successful completion:

1. move any durable, non-obvious decision into an existing project document when one exists;
2. remove the SCD Dev Loop task note;
3. remove an empty `.scd/tasks` directory only when SCD Dev Loop created it;
4. do not modify `.gitignore`, stage, or commit the state unless the user asks.

Read `references/continuity-contract.md` before creating, updating, resuming, or removing fallback state.

## Hand off naturally

For ordinary tasks, report only:

- outcome;
- important changed locations;
- observed verification;
- remaining risk or unverified work.

Do not print contract names, stage labels, or a workflow recap unless escalation occurred or the user asks.

## Resources

- `references/scope-contract.md` - material ambiguity and scope control.
- `references/evidence-contract.md` - risk-adaptive verification and completion language.
- `references/continuity-contract.md` - state triggers, schema, lifecycle, and hook behavior.
- `assets/current-task.md` - fallback state template; copy only when continuity requires it.
