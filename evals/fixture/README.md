# Deskboard

Deskboard is a small in-memory issue tracker used for development workflow tests.

## Modules

- `issues.mjs` normalizes issue input.
- `store.mjs` owns persistence behavior.
- `service.mjs` exposes application operations.
- `render.mjs` produces issue-list markup.

## Urgent issues

Callers may pass `urgent: true` to `createIssue`. Urgent issues must:

1. store `priority` as `critical`, overriding a supplied priority;
2. render a visible `<span class="issue__badge">URGENT</span>` before the title;
3. preserve all non-urgent behavior.
