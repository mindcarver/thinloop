# QuickDev continuity contract

Use this reference only for work that must survive the current context.

## Carrier priority

Use the first suitable source:

1. the governing GitHub Issue for requirements, acceptance, tasks, and durable
   delivery evidence;
2. existing architecture, ADR, UX, or machine contracts for durable technical
   decisions in their scope;
3. `.scd/tasks/current.md` only as a local recovery fallback.

Never copy the entire Issue, conversation, source file, or command log into the
fallback. Store only the delta needed to resume.

## Fallback schema

Copy `assets/current-task.md` to `.scd/tasks/current.md` and replace every
placeholder.

The frontmatter must contain:

```yaml
managed_by: scd-quickdev
issue: https://github.com/example/project/issues/123
status: active
updated_at: 2026-07-27T12:34:56+08:00
```

Allowed statuses are:

- `active` — work can continue;
- `blocked` — a named input or external condition is required.

The document must contain non-empty sections:

- `## Outcome`
- `## Boundaries`
- `## Acceptance`
- `## Decisions`
- `## Evidence`
- `## Next action`

Reference Issue acceptance identifiers rather than copying their full text.
Use exactly one concrete next action. Write `None yet` for decisions when no
non-obvious decision exists. Evidence may say verification has not run yet, but
must name the planned or blocked check.

## Lifecycle

- Update the note after a material implementation decision, meaningful
  evidence, or changed next action.
- Before ending an incomplete turn, make the note sufficient for a new agent to
  continue from the Issue and repository without the transcript.
- When blocked, name the missing authority, input, or environment condition.
- After merge, promote durable evidence to the Issue or pull request, then
  delete the fallback note.
- Never auto-stage, auto-commit, or add ignore rules for the note.

## Hook boundary

The bundled `PreCompact` and `Stop` hook checks only
`.scd/tasks/current.md` files marked `managed_by: scd-quickdev` or
`managed_by: scd-discovery`. QuickDev state must reference its governing
GitHub Issue.

Legacy `managed_by: scd-dev-loop` state is blocked with a migration message so
unfinished work is not silently ignored after the rename.

The hook validates structure and resumability. It does not decide whether the
Issue is correct, whether evidence is semantically sufficient, or whether an
ordinary task should have created local state.

If the hook reports an incomplete note, update the note and let the lifecycle
event run again. If the hook cannot inspect state, it fails open with a warning.
