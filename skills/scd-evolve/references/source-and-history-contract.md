# Source and History Contract

## Authoritative Source

Resolve the source root in this order:

1. an absolute path explicitly supplied for the current invocation;
2. `thinloop_source_root` in `<user-home>/.scd/config.json`.

Require an absolute path. Resolve symlinks before checking authority. A valid root must contain:

- `.git` as a file or directory;
- `.codex-plugin/plugin.json` with `name` equal to `thinloop`;
- `skills/scd-evolve/SKILL.md`.

Reject any requested or resolved path with a `plugins/cache` segment. Do not accept an installed Skill directory, copied plugin directory, package-manager cache, or consumer repository.

If config is absent, invalid JSON, or missing the key, report the exact issue and request an explicit source root. Do not create or overwrite config implicitly. If the user asks to save the key, show the proposed config change, require approval, preserve every unrelated key, and read it back after writing.

## Repository Boundary

Before a trial:

- inspect branch and Git status;
- map every candidate operation to owned files;
- stop on overlapping uncommitted changes;
- preserve unrelated uncommitted and untracked files;
- never use broad reset, checkout, restore, or clean operations;
- keep rollback snapshots outside the repository and delete them only after a verified terminal event.

Source authority establishes where a write may occur. It does not authorize a write; candidate-ID approval is still required.

## History Location

Store events at:

```text
.scd/evolution/history.jsonl
```

The file is append-only and eligible for version control. Do not create a synthetic baseline record. Each line is one event conforming to `contracts/evolution-history.schema.json`.

Allowed statuses and transitions:

```text
null → proposed
proposed → trial | rejected
trial → accepted | rejected | reverted | trial-unverified
```

Terminal states do not transition further. Reusing a candidate ID after a terminal event is invalid.

## Persisted Data

Persist only:

- event, candidate, and run identifiers;
- timestamp, status, previous status, and schema version;
- Thinloop target skill names, root-cause abstraction, coupling rationale, and change kinds;
- coverage, candidate grade, attribution class, and short abstract rationale;
- matched and unmatched signal abstractions;
- evidence types, a short sanitized summary, SHA-256 fingerprint, and redaction flag;
- repository-relative add/delete/replace operation summaries;
- validation names, outcomes, and abstract evidence;
- before and after semantic versions;
- self-evolution flag and prior source run ID.

Never persist:

- raw or quoted conversation, prompt, log, or tool output;
- consumer-project name, repository name, branch name, or absolute path;
- source code, code fence, code snippet, patch body, user data, or personal identifier;
- credentials, tokens, private keys, authentication material, or secret-like values.

Set `evidence_redacted: true` whenever private evidence was minimized or transformed. The fingerprint identifies evidence without retaining its contents; it is not proof that the underlying interpretation is correct.

## History Tool

Use `evolution-history.mjs validate` before relying on an existing history. Use `append --root <authoritative-root>` only after candidate approval; the CLI revalidates source authority and derives the history path instead of accepting an arbitrary write destination. The tool validates record shape, privacy patterns, lifecycle transitions, batch identity, self-evolution provenance, accepted patch increments, and validation-kind requirements.

Keep the sanitized input record outside the repository and remove it after the append result is known. The tool writes through a lock and same-directory temporary file before rename. A validation or write failure leaves the existing history unchanged and must be reported without claiming persistence.
