---
name: scd-quickdev
description: "Drive one delivery Issue from request to verified merged code whenever a coding agent is asked to change a repository: fix a bug, add a feature, refactor code, change configuration, perform a migration, or resume unfinished implementation work. Route underdefined product work through scd-discovery and multi-delivery projects through scd-project; use one GitHub Delivery Issue as the delivery boundary and acceptance source of truth, consume an approved greenfield PRD when one governs product scope, diagnose bugs before fixing them, isolate meaningful work, verify the diff and observed behavior through an independent review and acceptance subagent, create a pull request, merge eligible changes into main, and close the Issue only after both gates pass. Do not trigger for advice-only questions, explanations, read-only reviews, Initiative Issues, PLANNED placeholders, or BLOCKED project nodes."
---

# SCD QuickDev

Move clear repository work through the shortest safe path from intent to merged
code. Keep process invisible when it adds no decision value, but preserve the
delivery boundary and evidence.

Maintain four contracts:

- the requested outcome, boundary, and acceptance must be clear;
- one GitHub Issue is the source of truth for the selected delivery boundary and
  acceptance;
- an approved greenfield PRD remains authoritative for product-level why,
  users, problem, MVP scope, `FR-*` requirements, and success metrics;
- implementation and completion claims must match observed evidence;
- merge and deployment authority must respect risk.

## Start from repository truth

1. Read applicable `AGENTS.md`, `CLAUDE.md`, and nearby repository instructions.
2. Inspect the branch, worktrees, remotes, and working tree; preserve unrelated
   user changes.
3. Reuse existing documentation, tests, naming, and implementation patterns.
4. Search and read targeted code before proposing a new abstraction.
5. Resume an existing QuickDev task note before starting overlapping work.
6. Find the governing GitHub Issue when one exists and treat it as the product
   contract.
7. When the request follows UIUX, read the relevant `.scd/ux/<slug>.md`, require
   `status: ready`, inspect its retained visual references, and use the shared
   interface contract rather than treating UX interface needs as an API.
8. When the request follows Architecture, read the relevant
   `.scd/architecture.md` or `.scd/designs/<feature>.md`, require `status:
   ready`, and parse the canonical machine-readable contracts with the same
   format-aware evidence used by their producers.
9. When the request follows Project, read the Initiative and selected Delivery
   Issue, confirm the node is an approved `READY` Issue in the current graph
   revision, and use only that Delivery Issue as the implementation contract.
10. When the Issue references a product PRD, read the exact approved version
    from the default branch, confirm every named `FR-*` identifier exists, and
    stop if the Issue contradicts or silently widens the product contract.

Treat a ready UX contract as the experience handoff, not as product approval or
frontend architecture. If it conflicts with the Issue, retained visuals, or an
unreconciled shared interface decision, return only that gap before
implementation.

Do not generate or redefine a PRD during implementation. Consume the approved
greenfield PRD when Discovery produced one; clear isolated changes and bugs
remain Issue-only. Do not generate a project wiki, permanent implementation
plan, role system, command suite, worktree, extra subagent ceremony, or TDD
ceremony merely to satisfy this skill. The independent reviewer and acceptance
verifier required below is the only default subagent role.

## Select the lightest sufficient path

Derive the outcome, boundary, and observable acceptance from the request and
repository, then choose internally:

- **Direct:** outcome, boundary, and observable acceptance are clear. Create or
  confirm the GitHub Issue and proceed without extra product questions.
- **Clarify:** one answer can make the task executable. Ask that one material
  question, update the Issue, and proceed.
- **Project:** the request spans several independently verifiable deliveries,
  each needing its own Issue and delivery lane, or has hard cross-Issue
  dependencies. Use `scd-project`; do not treat the Initiative or a project
  checklist as one QuickDev task. Several pull requests caused only by
  implementation size do not trigger Project.
- **Discovery:** several dependent product decisions or a high-cost product
  boundary remain open. Use `scd-discovery`, obtain explicit approval, and
  continue from its resulting Delivery Issue or `scd-project` handoff.

Do not announce these path names unless the user asks. A new product,
application, plugin, service, or system normally takes Discovery; one isolated
ambiguity does not.

An explicit request to implement or use QuickDev authorizes the ordinary
task-local Issue, branch, push, pull request, eligible merge, and cleanup steps
in the named repository. It does not authorize high-risk merge, production
deployment, live migration, unrelated changes, or access beyond that
repository.

When another Thinloop skill delegates a bounded implementation, its narrower
delivery boundary wins. Do not expand a local trial or selected repair into the
standalone QuickDev Issue-to-merge flow. In particular, an `scd-evolve` trial
does not authorize commit, push, pull request, or merge because Evolve retains
those actions behind separate user authorization.

`scd-project` does not authorize implementation of every project node. Accept
only one explicitly selected, approved `READY` Delivery Issue. Selection may
come directly from the user or from an approved Reengineering execution wave
whose exact Initiative graph revision remains current. Refuse an Initiative,
PLANNED placeholder, BLOCKED node, stale graph revision, or a request to absorb
sibling Issues, and return the exact project gap instead of creating a branch.

For a PRD-governed product, also refuse a missing, draft, uncommitted,
superseded, or contradictory PRD reference and an Issue whose named `FR-*`
identifiers do not exist in the approved version. Return that product-contract
gap to Discovery rather than guessing the intended scope.

Read `references/scope-contract.md` when ambiguity or scope expansion is
plausible. Read `references/issue-delivery-contract.md` before creating or
updating an Issue, branch, worktree, pull request, merge, or UAT handoff.

## Diagnose bugs before changing behavior

For a bug:

1. record the observed symptom and expected behavior;
2. reproduce the symptom through the narrowest reliable path;
3. form competing hypotheses and inspect the causal path;
4. identify the causal root cause rather than patching the visible effect;
5. add or identify a regression test that fails for the defect;
6. implement the smallest coherent fix;
7. rerun the same path plus proportionate surrounding checks.

If reproduction is impossible, keep root cause `Unconfirmed`, state the missing
evidence, and do not represent correlation as causation. A cause supplied by the
user is a hypothesis until repository or runtime evidence supports it.

## Implement the smallest coherent change

- Add the implementation checklist to the governing Issue after targeted code
  inspection; do not duplicate it in a local specification.
- Implement directly when the path is clear.
- Use a short conversational plan only for dependent work that benefits from
  sequencing.
- Follow existing tests and architecture unless they cause the defect.
- Keep unrelated cleanup outside the branch and pull request.
- Update the Issue before proceeding when evidence changes product-visible
  behavior, scope, data or privacy boundaries, permissions, irreversible
  actions, or acceptance. Obtain approval again only for the affected product
  decision.

Escalate process only after evidence reveals actual risk.

## Verify engineering acceptance

Before claiming success, run the strongest practical evidence for the changed
behavior. Prefer:

1. focused behavior or regression tests;
2. relevant typecheck, lint, build, or broader tests;
3. runtime, API, or UI exercise with observable output;
4. static inspection only when execution is unavailable.

Inspect exit codes and meaningful output. Map every item to observed evidence,
`UNVERIFIED`, or a named blocker. Never use an unrelated passing check as
evidence.

Before delivery, review the complete issue-specific diff for correctness,
security, acceptance coverage, unintended files, and regression risk. Fix
in-scope findings and record verification on the Issue and pull request.

After implementation and the parent agent's engineering checks, delegate
independent code review and final acceptance to one separate fresh-context subagent.
It must independently read the governing Issue, acceptance items, repository
instructions, and actual issue-specific diff. It must not rely only on the
implementing agent's summary and must not modify product code.

The verifier performs two ordered gates:

1. **Independent code review.** For reviewable code changes, prefer the
   `open-code-review-delegate` skill when it is discoverable. Otherwise, when
   `command -v ocr` succeeds, use `ocr delegate preview` for the exact base and
   target refs, then `ocr delegate rule` for the returned files. If neither
   capability is available, perform a normal fresh-context diff review and
   record `OCR_UNAVAILABLE`; do not install or configure OCR as part of
   QuickDev. If OCR invocation fails, preserve the exact error and use the same
   manual fallback without claiming OCR success. Validate every OCR finding
   against the actual code and requirement context, discard false positives,
   and return `REVIEW_PASS` or `REVIEW_FAIL` with confirmed findings. A review
   failure returns to implementation and must be repeated after repair.
2. **Behavioral acceptance.** Only after `REVIEW_PASS`, run the strongest
   practical checks that directly exercise each acceptance item, including
   browser, real-model, or produced-artifact validation when relevant. A
   documentation-only or otherwise non-code diff still needs proportional
   independent inspection, but must not invent code findings.

Provider-backed `ocr review` is not required; delegation uses the host agent's
model. The independent verifier only reports findings. The parent implementing
agent validates the returned evidence, applies in-scope fixes, and requests a
fresh review.

After both gates, the verifier returns exactly one evidence-backed acceptance
outcome:

- **PASS:** every acceptance item has direct observed evidence;
- **FAIL:** changed behavior violates an acceptance item; return the findings to
  implementation, repair them, and repeat independent verification;
- **BLOCKED:** required verification cannot run; record the blocker and keep the
  Issue open.

Only `REVIEW_PASS` followed by acceptance `PASS` authorizes delivery and later
Issue closure. A passing unrelated suite, static prompt inspection for a
real-model behavior, or a fake runtime for a real-environment acceptance item
cannot produce `PASS`.

Read `references/evidence-contract.md` when selecting checks or reporting
incomplete evidence.

## Deliver through the pull request

When implementation and engineering verification pass:

1. commit only the issue-specific diff and push its branch;
2. create the pull request with `Refs #<issue>` and acceptance evidence;
3. wait for required CI and repository checks;
4. resolve in-scope failures and repeat the affected verification;
5. when the delivery contract permits, merge it into `main`;
6. synchronize local `main` and safely remove the merged branch or temporary
   worktree;
7. confirm the merged revision is the independently verified change, rerunning
   acceptance on `main` when merge, deployment, or environment state can change
   the result;
8. attach the verifier evidence and close the Issue.

Do not close the Issue at merge time or through pull-request auto-close syntax.
Close it explicitly only after independent acceptance returns `PASS`. On
`FAIL`, record the observed result on the same Issue and re-enter QuickDev. On
`BLOCKED`, record the missing evidence and leave the Issue open.

## Preserve continuity only when needed

Use durable local state only when the task may cross a session or compaction,
has multiple independent acceptance paths, contains a consequential handoff
decision, or is paused.

The GitHub Issue remains authoritative. If local recovery state is necessary,
create `.scd/tasks/current.md` from `assets/current-task.md`, reference the
Issue, and store only the resume delta. Maintain at most one fallback note per
worktree.

Before stopping or compaction, keep its status, evidence, and one next action
current. On successful merge, remove the fallback note without staging it.

Read `references/continuity-contract.md` before creating, updating, resuming, or
removing fallback state.

## Hand off naturally

For ordinary tasks, report only:

- merged outcome and pull request;
- important changed locations;
- observed engineering verification;
- independent acceptance result and Issue status;
- remaining risk or unverified work.

Do not print contract names, stage labels, or a workflow recap unless escalation
occurred or the user asks.

## Resources

- `references/scope-contract.md` - material ambiguity and scope control.
- `references/issue-delivery-contract.md` - Issue, isolation, PR, merge, and
  independent acceptance rules.
- `references/evidence-contract.md` - risk-adaptive verification and completion
  language.
- `references/continuity-contract.md` - fallback state schema and lifecycle.
- `assets/current-task.md` - fallback recovery template.
