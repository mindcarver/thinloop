# Continuity contract

Use this reference only for work that must survive the current context.

## Carrier priority

Use the first suitable source of truth:

1. an existing issue or task document already governing the work;
2. an existing project plan or implementation note;
3. `.scd/tasks/current.md` as the fallback.

Do not copy an entire issue, conversation, source file, or command log into fallback state. Store only the delta needed to resume.

## Fallback schema

Copy `assets/current-task.md` to `.scd/tasks/current.md` and replace every placeholder.

The frontmatter must contain:

```yaml
managed_by: scd-dev-loop
status: active
updated_at: 2026-07-26T12:34:56+08:00
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

Use exactly one concrete next action. Write `None yet` for decisions when no non-obvious decision exists. Evidence may say that verification has not run yet, but must name the planned or blocked check.

## Lifecycle

- Update the note after a material decision, meaningful evidence, or changed next action.
- Before ending an incomplete turn, make the note sufficient for a new agent to continue without the transcript.
- When blocked, name the missing authority, input, or environment condition.
- When complete, promote only durable decisions, then delete the fallback note.
- Never auto-stage, auto-commit, or add ignore rules for the note.

## Hook boundary

The bundled `PreCompact` and `Stop` hook checks only `.scd/tasks/current.md` files marked `managed_by: scd-dev-loop`.

It validates structure and resumability. It does not decide whether product scope is correct, whether evidence is semantically sufficient, or whether an ordinary task should have created state.

If the hook reports an incomplete note, update the note and let the lifecycle event run again. If the hook itself cannot inspect state, it fails open with a warning rather than trapping the session.
