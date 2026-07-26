---
managed_by: scd-discovery
status: approved
---

# Outcome

Thinloop turns an underdefined product idea into an explicitly approved, testable delivery contract before implementation, while clear repository changes remain nearly zero-overhead.

# Users and Problem

The primary user is an individual developer using a strong coding model across medium-sized projects. Existing heavyweight methods can preserve rigor but often impose fixed stages, document sets, roles, or repeated approval points. Thinloop needs deeper requirement discovery without taking control of ordinary implementation.

# Shared Language

- **Direct:** the outcome, boundary, and observable acceptance are already clear.
- **Clarify:** one material answer can make the request executable.
- **Discovery:** several dependent product decisions or a high-cost boundary remains unresolved.
- **Delivery contract:** the approved behavior, boundaries, decisions, and acceptance for the next complete version.
- **Verification seam:** the external UI, API, CLI, file, state, or event through which acceptance can be observed.

# User Scenarios

1. A user asks to create a new product, application, plugin, service, or system. Thinloop investigates known facts and begins Discovery before implementation.
2. A user requests a clear local change. Thinloop proceeds directly without extra questions or process artifacts.
3. A request has one isolated material ambiguity. Thinloop asks one recommended question, then proceeds.
4. A user supplies a complete specification. Thinloop audits only material gaps and takes the review fast path.
5. A long discovery is interrupted. A new session resumes from the correct decision using minimal SCD state.
6. Implementation reveals a change to an approved product boundary. Thinloop returns only the affected contract to review.

# Rules and Decisions

- Discovery is the default for greenfield products and other high-decision-surface work.
- Confirm the primary user, problem, and desired change before accepting an unconfirmed solution form; use no more than two opening decisions for this.
- Cover the next complete delivery, not the product's entire future.
- Ask one decision at a time, with a recommendation and rationale, following dependency order.
- Research repository and environment facts instead of asking the user to recall them.
- Keep facts, confirmed decisions, assumptions, deferred decisions, and open decisions distinct.
- Run a silent adversarial review before requesting approval.
- Require one explicit approval of the combined delivery contract before implementation.
- Do not add fixed approvals for architecture, task breakdown, or reversible implementation choices.
- Number acceptance items so `scd-dev-loop` can map each one to evidence.

# Failure and Edge Cases

- A complete existing specification must not cause a redundant interview.
- A discussion-only request must not create repository files unless the user asks.
- Silence, topic changes, or partial agreement do not approve a contract.
- A user may request a prototype; unresolved product behavior remains an explicit assumption.
- An implementation detail does not reopen Discovery unless it changes behavior, scope, data or privacy, permissions, irreversible action, or acceptance.
- Hook errors fail open with a warning instead of trapping the session.

# Constraints

- Keep two public skills: `scd-discovery` and `scd-dev-loop`.
- Do not add MCP servers, roles, command suites, mandatory TDD, worktrees, subagents, or automatic commits.
- Use `.scd`, never `.ai`, for SCD-managed project state.
- Prefer existing repository documentation locations before creating SCD fallbacks.
- Maintain at most one `.scd/tasks/current.md` per worktree.
- Support Windows and Node.js 18 or newer for the bundled Hook.

# In Scope

- Discovery routing, interviewing, readiness review, explicit approval, artifact rules, and Dev Loop handoff.
- Medium-project documentation guidance.
- Acceptance-to-evidence mapping.
- Continuity Hook support for both SCD skills.
- Codex Skill metadata, repository documentation, local validation, and Junction installation.

# Out of Scope

- Marketplace creation or repair.
- Team policy, Claude Code adaptation, public release packaging, or remote services.
- Automatic architecture generation for every repository.
- Claiming real Discovery behavior results before isolated agent evaluation runs.

# Testing Seam

- Skill and plugin structure are checked with the official local validators.
- Package invariants are checked with Node tests.
- Hook behavior is exercised as a subprocess against temporary workspaces.
- Discovery evaluation case structure is checked locally.
- Skill installation is checked through Junction targets and source/target hashes.
- Actual routing and interview quality require fresh isolated Codex tasks and remain separately reported.

# Acceptance

- A1: Greenfield and high-decision-surface requests route to Discovery, while clear local changes remain Direct and one isolated ambiguity remains Clarify.
- A2: Full Discovery investigates first, covers only the next delivery, and asks one dependency-ordered decision with a recommendation at a time.
- A3: No full-discovery implementation begins before one explicit approval; complete approved specifications use the fast path.
- A4: Short discussions create no state, while interrupted discovery can resume from one valid `.scd/tasks/current.md`.
- A5: Approved delivery specifications use `.scd/specs/<slug>.md`; medium projects default to one evolving architecture document and no permanent implementation plan.
- A6: `scd-dev-loop` treats the approved specification as the product contract and maps every numbered acceptance item to observed evidence, an unverified boundary, or a blocker.
- A7: The Hook validates continuity state managed by either SCD skill, ignores unrelated files, blocks incomplete managed state, and fails open on its own errors.
- A8: Both skills and the plugin validate, the README documents the two-skill workflow, both Windows Junctions point to repository sources, and only scoped files are committed.

# Assumptions

- Codex can route implicit skills from their descriptions, but real routing quality must be evaluated in fresh tasks.
- A user response such as "确认", "开始做", or an unambiguous "继续" directly following the approval request counts as explicit approval.

# Deferred Decisions

- Split specification synthesis into a separate `scd-spec` skill only if repeated real use shows independent value.
- Promote shared terminology to `.scd/context.md` only after it recurs across specifications or causes ambiguity.
- Add separate data-model or technical-design documents only when actual project complexity activates their thresholds.
