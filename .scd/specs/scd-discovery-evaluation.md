---
managed_by: scd-discovery
status: approved
---

# Outcome

Provide a reproducible, evidence-preserving evaluation that determines whether
`scd-discovery` improves requirements discovery over the strong-model baseline
without adding process to already-clear work.

# Users and Problem

The primary user is the Thinloop maintainer. Static skill validation and the
existing development-task fixtures do not show whether Codex discovers and
routes the skill implicitly, conducts a useful multi-turn interview, avoids
premature implementation, or adds unnecessary friction.

# Shared Language

- **Baseline:** Thinloop commit `3141d81`, containing `scd-dev-loop` without
  `scd-discovery`.
- **Candidate:** Thinloop commit `bcdee83`, containing both current skills.
- **Subject:** the Codex process whose behavior is being evaluated.
- **Simulator:** a skill-free Codex process constrained by a hidden case
  factsheet to provide consistent user replies.
- **Judge:** a skill-free, anonymous semantic evaluator.
- **Indeterminate:** infrastructure, authentication, simulator, or judge failure
  that cannot be counted as product success or failure.

# User Scenarios

1. A clear small request should be recognized as ready without discovery
   questions or state artifacts.
2. An underdefined consequential request should be explored one material
   decision at a time until a verifiable combined contract can be approved.
3. A complete specification should take the readiness fast path without
   redundant questioning.
4. The maintainer should be able to compare baseline and candidate under the
   same model, fixture, prompt, permissions, and run configuration.
5. A failed or interrupted evaluation should retain sanitized evidence without
   retaining authentication material.

# Rules and Decisions

- The first suite ends at approval and never requests implementation.
- The only scored subject surface is the real `codex exec` CLI.
- Each subject run uses a disposable fixture and an isolated temporary
  `CODEX_HOME`. Only authentication and the skill snapshot for that condition
  are seeded.
- Subject runs pin `gpt-5.6-sol`, high reasoning, and priority service tier.
  Simulator runs use low reasoning; judge runs use high reasoning.
- The subject uses workspace-write permissions inside the disposable fixture,
  no additional writable directories, and no dangerous sandbox bypass.
- Cases use natural "discuss first, do not implement yet" wording. They never
  name Thinloop, a skill, the expected route, or the rubric.
- The nine scored cases cover CLI, web, and API/data repositories. Each product
  shape has one clear, one underdefined, and one complete-spec case.
- The simulator may answer only the current question from its hidden factsheet.
  Approval is allowed only after every required decision has been resolved.
- Clear cases end after one subject response. Complete-spec cases allow at most
  two subject responses. Underdefined cases allow at most twelve.
- Deterministic checks own hard facts. An anonymous LLM judge owns semantic
  quality. Human review is required only for uncertain or conflicting results.
- Hard failures cannot be averaged away by quality scores.
- Test code, fixtures, schemas, and graders live in the Thinloop repository.
  Raw sanitized runs live under
  the sibling `test\thinloop-eval-workspace` outside the Thinloop repository.
  Only reviewed, anonymous summaries may be promoted to `benchmarks/`.
- The evaluation framework uses Node.js ESM and built-in modules only, with a
  thin PowerShell launcher for Windows.

# Failure and Edge Cases

- A missing or unavailable pinned model produces `indeterminate`; the runner
  must not silently switch models.
- A simulator response that cannot map to the factsheet produces
  `indeterminate`, not a subject failure.
- Authentication files must never enter a run result, report, transcript, Git
  diff, or committed artifact.
- A temporary subject home must survive long enough for `codex exec resume`,
  then be deleted even when the case fails.
- Infrastructure failures may be retried once. Behavioral failures are not
  retried.
- Before approval, any implementation-file change is a hard failure. Temporary
  discovery state may exist for a long interview but must be absent when the
  discussion finishes.
- Existing unrelated work, including the untracked `scd-knowledge` files, must
  remain untouched and uncommitted.

# Constraints

- Windows and PowerShell are the first-version host.
- Node.js 18 or newer is required.
- No npm install or third-party runtime dependency.
- Baseline and candidate use identical subject prompts, models, reasoning,
  service tier, permissions, and fixture snapshots.
- A run manifest records CLI version, exact commits, configuration, timestamps,
  attempts, and evidence locations.

# In Scope

- Nine controlled discovery cases and three product-shape fixtures.
- Disposable repository and Codex-home preparation.
- Multi-turn subject execution with a factsheet-constrained simulator.
- Deterministic grading, anonymous semantic judging, redaction, reporting, and
  unit/integration tests for the harness.
- Three unscored candidate smoke runs.
- Thirty-six scored paired runs: nine cases, two conditions, two repetitions.

# Out of Scope

- Full feature implementation.
- Discovery-to-Dev-Loop handoff and `.scd/specs` persistence behavior.
- Continuity, reapproval, evidence, and implementation suites already described
  by the earlier twelve-case catalog.
- CI execution requiring private credentials.
- Public benchmark claims beyond the observed model and host configuration.
- Claude Code, team policy, hosted evaluation infrastructure, or additional
  model providers.

# Testing Seam

- Node tests validate schemas, fixture preparation, snapshot installation,
  redaction, transcript extraction, state transitions, deterministic grading,
  and report aggregation.
- A dry-run mode validates every command and artifact without calling a model.
- Three real candidate smoke cases validate actual skill discovery, JSONL
  capture, session resume, simulator control, and cleanup.
- The full paired run produces per-run manifests, sanitized JSONL, transcripts,
  Git diffs, deterministic verdicts, anonymous judge results, and aggregate
  reports.

# Acceptance

- A1: The repository contains exactly nine valid first-suite cases: three clear,
  three underdefined, and three complete, distributed across CLI, web, and
  API/data fixtures.
- A2: Baseline and candidate subject runs use isolated temporary Codex homes and
  install only the skills present at their declared commits.
- A3: All subject runs use the pinned model/configuration and the real
  `codex exec` JSONL interface; unavailable infrastructure is reported as
  `indeterminate`.
- A4: Clear cases stop after one response with no discovery question, no
  implementation change, and no persistent `.scd` artifact.
- A5: Complete cases finish within two responses with no redundant material
  question and no implementation change.
- A6: Underdefined cases are driven by the hidden factsheet, never receive early
  approval, and finish or fail within twelve subject responses.
- A7: Deterministic graders detect premature implementation, invented approval,
  out-of-scope writes, persistent temporary state, retry misuse, and secret
  leakage; semantic results are anonymized and support `uncertain`.
- A8: Three unscored real smoke runs and thirty-six scored paired runs produce a
  complete sanitized evidence set and aggregate report in the external
  evaluation workspace.
- A9: Candidate release requires zero critical violations, clear `6/6`, complete
  `6/6`, underdefined at least `5/6`, at least four of six anonymous
  underdefined preferences for candidate, and at most one preference for
  baseline.
- A10: All harness tests pass with Node built-ins only, temporary homes are
  cleaned, authentication is absent from outputs, and unrelated untracked work
  is preserved.

# Assumptions

- The current Codex authentication can be copied temporarily for local
  non-interactive runs.
- `codex exec resume` requires per-case session persistence, so subject runs may
  not use `--ephemeral`; isolation is provided by the disposable home and final
  cleanup instead.
- The pinned model is available through the current authenticated Codex account.

# Deferred Decisions

- Public shadow-test fixtures derived from real projects.
- More than two repetitions per condition.
- A second independent judge model.
- Full implementation, continuity, and contract-change evaluation suites.
