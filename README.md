# Thinloop

Thinloop is a lightweight Codex development plugin built around SCD:
**Simplify Complex Development**. It keeps repository work:

- scoped to the requested outcome;
- backed by observed verification;
- resumable when unfinished work outlives the current context.

It does not impose a fixed pipeline, project wiki, agent team, command suite, MCP server, mandatory TDD, or automatic Git actions.

## Components

- one implicitly invokable `scd-dev-loop` Skill;
- three on-demand contract references;
- one optional `.ai/tasks/current.md` template;
- one lifecycle Hook for incomplete fallback state.

## Hook behavior

Codex discovers `hooks/hooks.json` from the plugin root. The Hook runs at `PreCompact` and `Stop`, but becomes active only when the current repository contains an SCD-managed `.ai/tasks/current.md`.

After installation, review and trust the plugin Hook in Codex. Hook trust is tied to the current Hook definition and must be reviewed again after it changes.

## Runtime

The first version targets Codex on Windows and requires Node.js 18 or newer for the dependency-free Hook script.

## Development checks

From the plugin root:

```powershell
node --test tests/check-state.test.mjs
```

Then run the Codex Skill and plugin validators supplied with the local Codex installation.
