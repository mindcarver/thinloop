---
managed_by: scd-discovery
status: approved
---

# Outcome

Thinloop provides a user-invoked `scd-knowledge` skill that captures concise, evidence-backed development experience as approved project or personal cross-project Markdown knowledge and retrieves only relevant knowledge on request.

# Users and Problem

The primary user is an individual developer working with coding agents across multiple repositories. Valuable debugging and optimization experience is often trapped in a conversation, while indiscriminate memory creates noise, stale rules, and misplaced project-specific guidance.

# Main Journeys

1. The user explicitly asks to preserve an experience. The agent inspects the current evidence or the user's stated practice, proposes concise knowledge with a project or cross-project destination, checks duplicates and conflicts, and writes only after confirmation.
2. The user explicitly asks for prior experience. The agent searches the project index first, then the configured personal index, reads only relevant entries, checks their boundaries, and reports what it used.
3. The user asks to update, merge, replace, or archive knowledge. The agent shows the proposed lifecycle change and applies it only after confirmation.

# Decisions

- Store project knowledge under `.scd/knowledge/` and keep it eligible for version control without staging or committing automatically.
- Store personal cross-project knowledge at an absolute path supplied by the user.
- Persist the personal root in a user-level SCD configuration; allow an explicit path to override it for one invocation.
- Use Markdown with a short `INDEX.md`, active `entries/`, and an `archive/` excluded from ordinary retrieval.
- Keep entries brief: trigger, guidance, boundary, minimal sufficient evidence, and source.
- Require evidence for agent-derived conclusions. Treat explicit human practice as a valid source.
- Permit a single well-supported project experience to become cross-project knowledge when the conclusion is portable and its boundaries are explicit.
- Require user confirmation before every write, update, merge, replacement, or archive operation.
- Never store credentials, authentication material, private keys, or other direct secrets.
- Support Windows, macOS, and Linux without platform-specific workflow behavior.

# Classification

- Prefer project knowledge when the conclusion depends on repository paths, internal names, private infrastructure, project architecture, team conventions, or a project-specific version.
- Recommend cross-project knowledge when the trigger and action remain useful outside the current repository and the applicable technology, platform, or situation is explicit.
- When portability is uncertain, recommend project knowledge.

# Lifecycle

- Skip an exact duplicate.
- Update an existing entry when new evidence materially sharpens it.
- Present conflicting knowledge and evidence for a human decision; never overwrite silently.
- Move superseded knowledge to `archive/` and remove it from the active index.

# Failure Behavior

- Retrieval may continue with one available store while reporting the unavailable store.
- A write must not change its target scope when the destination is missing or unwritable.
- A failed write may return a concise draft but must not claim persistence.
- Evidence must be redacted before presentation or storage; if redaction removes the support for the conclusion, do not write the entry.

# Out of Scope

- Automatic invocation during ordinary development.
- Automatic session monitoring, hooks, skill generation, commits, pushes, remote synchronization, team permissions, vector databases, or MCP knowledge services.
- Saving full conversations, full logs, or large code excerpts.

# Acceptance

- A1: Ordinary development requests do not implicitly invoke `scd-knowledge`.
- A2: A first-use personal knowledge root can be saved and reused, with an explicit per-invocation override.
- A3: Capture produces evidence-backed candidates with a scope recommendation, rationale, and exact target before any write.
- A4: No knowledge file changes before explicit user confirmation.
- A5: Approved knowledge is written concisely to the correct store and its short active index is updated.
- A6: Project knowledge is visible as repository changes without automatic staging or committing.
- A7: Retrieval searches project knowledge before personal knowledge and reads only relevant active entries.
- A8: Duplicate, refinement, conflict, and archive cases follow the approved lifecycle.
- A9: Direct secrets are blocked and evidence is minimized and redacted.
- A10: Missing or unwritable targets are reported without silently changing scope or claiming success.
- A11: Skill instructions and paths are portable across Windows, macOS, and Linux.

# Verification Seams

- Official skill and plugin validators check package structure and metadata.
- Node contract tests inspect trigger policy, storage paths, approval, evidence, lifecycle, safety, and failure rules.
- Evaluation cases cover explicit and implicit routing, capture, retrieval, conflict, safety, and unavailable-store behavior.
