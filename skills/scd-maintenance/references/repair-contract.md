# Maintenance repair contract

Use this contract before repairing multiple findings or deleting code,
documentation, dependencies, configuration, or compatibility paths.

## Select a bounded batch

Use the exact findings selected by the user. If the user gives a broad cleanup
request without selecting findings, recommend and repair at most three that
share one verification surface. Prefer:

1. critical or high-severity correctness and safety drift;
2. deterministic repairs with strong verification;
3. one coherent subsystem over unrelated easy edits.

Do not mix a behavior change, dependency migration, architecture rewrite, and
documentation cleanup into one maintenance batch.

## Revalidate before editing

For every finding:

- confirm that the evidence still exists in the current worktree;
- inspect unrelated user changes around the target;
- name the authority that the repair will restore;
- identify direct producers, consumers, tests, examples, and documents;
- identify rollback or compatibility consequences.

Drop stale findings instead of forcing a planned cleanup.

## Protect deletions

Before deleting an artifact, use the strongest available evidence:

- language-aware reachability or dependency tooling;
- repository-wide references including dynamic registration conventions;
- build, test, packaging, and deployment configuration;
- public API and compatibility commitments;
- runtime discovery, reflection, plugin, migration, and fixture behavior.

Text search alone does not prove that dynamically loaded code is dead. If
reachability remains uncertain, deprecate, isolate, or report the candidate
instead of deleting it.

## Keep coupled truth together

When repairing drift, update every directly coupled surface in the same change:

- implementation and regression test;
- schema and migration;
- CLI behavior and help output;
- API implementation and machine-readable contract;
- configuration key, example, validation, and documentation;
- architecture rule and its executable enforcement;
- tutorial step and the runtime action that proves it.

Do not update descriptive documentation to conceal a violation of a normative
contract.

## Verify per finding

Map each finding identifier to observed evidence:

- focused regression, contract, architecture, or documentation test;
- relevant typecheck, lint, build, or package check;
- runtime, API, CLI, migration rehearsal, or UI exercise;
- static re-inspection only when execution is unavailable.

If a check was already failing before the repair, distinguish that baseline
failure from the new result. If verification is blocked, state the blocker and
leave the finding partially verified.

## Stop on expanded authority

Return to the user before continuing when evidence reveals:

- a product behavior or compatibility choice;
- an irreversible data or migration decision;
- a permission, privacy, or security boundary change;
- a cross-system architecture decision;
- a repair larger than the selected batch.

Do not use maintenance work as implicit authorization for those changes.
