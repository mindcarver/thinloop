---
name: scd-maintenance
description: "Audit and repair repository technical debt, code-documentation drift, stale specifications, architecture erosion, dead code, dependency hygiene, and obsolete project artifacts. Use when the user explicitly asks to inspect, clean up, reconcile, modernize, or reduce debt in an existing repository, including requests such as 'audit this repo', 'find stale docs', 'clean technical debt', or 'make the implementation and documentation agree'. Do not invoke automatically during ordinary feature work, routine code review, or documentation editing, and use scd-reengineering instead for a project-scale refactor or reimplementation."
---

# SCD Maintenance

Find maintainability problems from repository evidence, then repair only a
bounded, justified set. Keep broad audits read-only until the direction of each
conflict is known.

## Select the operation

- **Audit:** Use when the user asks to inspect, assess, list, or find debt.
  Produce findings without changing repository files.
- **Repair:** Use when the user explicitly asks to clean, fix, reconcile, or
  remove debt. Revalidate the target findings, resolve their authority, make
  the smallest coherent changes, and verify them.
- **Focused:** When the user names a file, subsystem, debt category, or
  finding, inspect only that scope and its direct consumers.

For a broad repair request, audit first and recommend a first batch of no more
than three findings. Do not interpret "clean the repository" as permission for
an unbounded rewrite.

Use `scd-reengineering` instead when the requested outcome is a project-scale
refactor, replacement implementation, language or framework port, architectural
replacement, or staged migration across several independently verifiable
deliveries. Maintenance may supply confirmed debt evidence, but it does not own
the reengineering direction or execution graph.

## Start from repository truth

1. Read applicable `AGENTS.md`, `CLAUDE.md`, repository instructions,
   manifests, tests, CI configuration, public documentation, and existing debt
   tooling.
2. Inspect the working tree and preserve unrelated user changes.
3. Prefer repository-native lint, test, documentation, dependency, schema, and
   architecture checks over generic guesses.
4. Run the bundled deterministic collector when Node.js is available:

   ```text
   node <this-skill>/scripts/collect-signals.mjs --root <repo> --format json
   ```

   Treat its output as leads, not a complete debt verdict. With Git available,
   it checks tracked and non-ignored files; otherwise it uses conservative
   filesystem exclusions. It detects broken relative Markdown links,
   documented npm scripts that do not exist, and explicit
   TODO/FIXME/HACK/XXX markers.
5. Exclude generated output, vendored dependencies, caches, fixtures that are
   intentionally inconsistent, and files ignored by the repository unless the
   user puts them in scope.

Read `references/audit-contract.md` before a broad audit or any
code-documentation consistency judgment.

## Audit activated surfaces

Inspect only categories supported by repository evidence:

- GitHub Issue product contracts, acceptance behavior, tests, and implementation;
- public API, CLI, configuration, schema, migration, and environment contracts;
- README instructions, tutorials, examples, screenshots, and local links;
- documented architecture, actual dependency direction, cycles, and ownership;
- dead files, exports, dependencies, feature flags, compatibility paths, and
  explicit debt markers;
- dependency age, security, or generated-artifact drift when repository tools
  can measure it.

Use deterministic checks first. Use semantic comparison second, limited to
documents and implementation surfaces that claim to describe one another.
Never infer that code is automatically correct merely because it is
executable.

## Produce evidence-backed findings

For every reported finding, include:

- a stable `MAINT-...` identifier when one is available;
- category and severity;
- the conflicting or obsolete claim;
- exact file, line, symbol, command, or runtime evidence;
- the likely authority and why;
- confidence and any material uncertainty;
- the smallest recommended repair and its verification path.

Separate confirmed debt from investigation leads. Do not report style
preferences, possible refactors, old file age, or missing document edits as
debt without evidence of cost, inconsistency, risk, or violated repository
policy.

Keep the report in the response by default. Do not create a permanent debt
ledger, issue, specification, or report file unless the user asks. When a file
is requested, copy and complete `assets/maintenance-report.md`.

## Repair selected findings

Before editing:

1. Reproduce or re-inspect each finding against the current worktree.
2. Determine whether the authority is a normative contract, executable
   behavior, or descriptive documentation.
3. Ask one concise question only when choosing the authority would change
   product behavior, compatibility, data, permissions, or another approved
   contract.
4. Drop findings that cannot be reproduced.

Then hand the bounded change to `scd-quickdev`:

- preserve public behavior unless the selected authority requires a change;
- fix the source and every directly coupled test, example, generated artifact,
  or document in the same change;
- use an established repository tool for mechanical refactors when available;
- run the strongest focused verification for each finding;
- stop and report when a repair exposes a larger product or architecture
  decision.

Do not stage, commit, push, publish, deploy, migrate live data, or create an
external issue unless the user explicitly requests that action.

Read `references/repair-contract.md` before repairing multiple findings or
deleting code or documentation.

## Hand off

For an audit, report the inspected scope, checks that actually ran, confirmed
findings ordered by severity, investigation leads, and blind spots.

For a repair, report the findings resolved, changed locations, observed
verification, findings intentionally deferred, and remaining uncertainty.

Do not claim that the repository is debt-free. State only what the activated
checks and inspected surfaces support.

## Resources

- `scripts/collect-signals.mjs` - dependency-free deterministic signal
  collector for cross-platform repository audits.
- `references/audit-contract.md` - authority, taxonomy, severity, confidence,
  and evidence rules.
- `references/repair-contract.md` - repair selection, deletion safety, and
  verification rules.
- `assets/maintenance-report.md` - optional persistent report template.
