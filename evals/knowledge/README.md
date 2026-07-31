# scd-knowledge paired behavior evaluation

This evaluation checks whether explicitly retrieved personal project knowledge
changes a bounded agent action and whether false or boundary-mismatched entries
are rejected. It does not treat retrieval, citation, or task success alone as
causal evidence.

The runner holds the task, fixture, model, reasoning, sandbox, and Skill
constant. Each case runs twice:

- `absent`: the project knowledge store is absent;
- `knowledge`: the same fixture contains one active project entry.

The five cases cover semantic, location, and behavioral discoverability plus a
missing-method claim and a platform-boundary mismatch. Public fixture tests are
intentionally insufficient to reveal the hidden project fact. The runner uses a
separate deterministic check after the subject finishes.

## Commands

Validate definitions without a model call:

```bash
node evals/knowledge/validate.mjs
node evals/knowledge/runner/run.mjs --mode dry
```

Run one applicable and one protective pair:

```bash
node evals/knowledge/runner/run.mjs --mode smoke
```

Run all five pairs:

```bash
node evals/knowledge/runner/run.mjs --mode full
```

Use `--case <id>`, `--conditions absent,knowledge`, `--workspace <path>`, or
`--run-id <id>` for a bounded diagnostic run. A run ID is never overwritten.

## Release gates

A run passes only when:

- both paired conditions ran without infrastructure failure;
- every knowledge-present case passed its repository and hidden checks;
- at least one applicable case failed without knowledge and passed with it;
- both misleading or boundary-mismatched entries were rejected;
- the saved result tree contains no authentication material.

The isolated Codex homes copy only the current login file and the working-tree
`scd-knowledge` Skill. Temporary homes are deleted after every subject. Saved
raw output is redacted, network access and unrelated runtime capabilities are
disabled, and fixtures live outside the Thinloop repository by default. The
default subject is `gpt-5.4` with high reasoning; `--model` may override it for
an explicitly compatible local Codex CLI.
