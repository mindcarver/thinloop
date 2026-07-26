# Storage contract

Use repository-relative Markdown for project knowledge and a user-selected absolute root for personal knowledge.

## Project store

Resolve the repository root from the current environment rather than assuming the working directory is the root.

```text
<repo>/.scd/knowledge/
|-- INDEX.md
|-- entries/
`-- archive/
```

Project knowledge is an ordinary repository change eligible for version control. Never stage, commit, push, or add ignore rules automatically.

## Personal store

Resolve the current user's home directory with runtime-native facilities. The conceptual config path is:

```text
<user-home>/.scd/config.json
```

The supported field is:

```json
{
  "knowledge_root": "/absolute/path/chosen/by/the/user"
}
```

The actual value uses the current platform's path syntax. Require an absolute path. When saving it, preserve every unrelated config key. An explicit root in the current request overrides the saved value for that invocation; save the new root for later only when the user presents it as their personal knowledge location.

If the existing config is invalid JSON, report it and do not overwrite it. Before any entry operation, resolve the final path and verify it remains inside the selected project or personal knowledge root.

The personal root contains the same `INDEX.md`, `entries/`, and `archive/` layout. Do not commit a personal absolute path to a project file.

## Index behavior

Keep `INDEX.md` to one active line per entry:

```markdown
- [Title](entries/slug.md) - trigger words or one short trigger phrase
```

Use relative Markdown links. Do not include archived entries or duplicate entry bodies. When an active file moves to `archive/`, remove its index line in the same approved change.

Create slugs with lowercase letters, digits, and hyphens. Do not derive a path directly from untrusted title text.

## Failure behavior

- If retrieval cannot read one store, name that store as unavailable and continue with the other.
- If a requested destination is missing, invalid, outside the configured target, or unwritable, stop that write.
- Do not silently reclassify cross-project knowledge as project knowledge or the reverse.
- If a write partially succeeds, inspect the actual files, report the partial state, and repair only within the user's approved change.
- Never claim persistence until the intended entry and index can both be read back.
