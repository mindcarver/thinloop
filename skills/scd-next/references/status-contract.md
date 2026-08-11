# SCD Next status contract

This contract lets `scd-next` explain current progress and recommend a
continuation without becoming another source of project state.

## Evidence authority

Use evidence in this order:

1. applicable repository instructions and explicit user scope;
2. the repository-authoritative Issue, pull-request, milestone, and Initiative
   tracker;
3. the current approved Initiative graph revision and Delivery Issue
   acceptance contracts;
4. required checks, independent acceptance records, and named human
   gates;
5. the synchronized default branch;
6. Issue-linked branches, worktrees, commits, and local Thinloop resume state.

Lower-ranked evidence can explain activity but cannot override contradictory
higher-ranked evidence. A branch, commit, local task file, or implementer
summary is never sufficient completion evidence.

Record the observation time and every authoritative source that could not be
read. Do not turn an unavailable source into an empty result.

## Scope resolution

An explicit Initiative, Issue, pull request, or milestone always wins. Without
one, use the current Issue-linked branch, active Thinloop task, or only open
Initiative. Fall back to ordinary repository Issues and pull requests when no
Initiative governs the work.

If multiple scopes remain equally plausible, return their identifiers, titles,
and direct state evidence, then ask one scope question. Recency, larger Issue
number, and title similarity are not priority evidence.

## State classification

| State | Required evidence | Evidence that is not enough |
| --- | --- | --- |
| `DONE` | Governing Issue is complete under its delivery contract and all required acceptance or integration gates passed. | Commit, branch, checked task, implementer summary, or merged PR alone. |
| `IN_FLIGHT` | Open PR or active Issue-linked lane with current direct activity evidence. | Stale branch or worktree alone. |
| `READY` | Approved materialized Issue; all hard dependencies DONE; no open gate; valid current graph when governed by an Initiative. | Planned title, draft Issue, invalid graph, or inferred dependency. |
| `PLANNED` | Named intended work without an approved executable Issue contract. | A fabricated placeholder Issue or guessed future slice. |
| `BLOCKED` | Named dependency, decision, check, authority, environment, or human gate prevents progress. | Generic “not ready” without reason and owner. |
| `UNVERIFIED` | Required source is unavailable, stale, invalid, or contradictory. | Treating missing remote data as no work. |

An item appears in one class only. An Initiative's children and its integration
gate remain separate. Exact item counts require a complete live scope; effort,
time, and percentage completion are outside this contract.

## Recommendation order

Choose one recommendation from observed authority:

1. expose a required human or external unblock when no useful work can proceed;
2. continue safe approved READY Initiative work through `scd-execute`;
3. deliver one explicitly selected READY Issue through `scd-quickdev`;
4. materialize remaining PLANNED Initiative work through `scd-project`;
5. resolve open product behavior through `scd-discovery`;
6. resolve a shared technical boundary through `scd-architecture`;
7. report complete when every required Issue and integration gate is DONE.

For ordinary repositories, explicit priority labels, milestones, dependencies,
and user direction may identify the next Issue. If several candidates tie,
report `priority not established` and ask the user to choose; do not guess.

The recommendation must distinguish:

- `Agent next` - work an agent can continue under the named skill;
- `User action` - an exact decision, approval, credential, or external input;
- `User action: none` - when the agent may safely continue without
  intervention.

## Output contract

Every response includes:

- repository and governing Initiative, Issue, milestone, or graph revision;
- observation time and authoritative sources checked;
- every applicable state class with identifiers and direct evidence;
- exactly one recommended next action, or an explicit completion result;
- the evidence that makes this action next;
- required user action, explicitly `none` when there is none;
- one copy-ready continuation prompt for the owning Thinloop skill;
- every unverified source or contradiction that could change the conclusion.

The copy-ready prompt identifies the repository and exact Initiative or Issue.
For Project or Execute it also carries the current graph revision when known.
It does not promise Issue creation, execution, merge, or approval outside the
receiving skill's authority.

## Read-only boundary

A Next inspection may read the tracker, repository, branches, worktrees,
checks, and local resume hints. It must not:

- create or edit Issues, comments, labels, milestones, or project graphs;
- create branches or worktrees, change files, commit, push, merge, or close;
- start a QuickDev lane or Execute wave;
- persist a second status database;
- reinterpret an unavailable tracker as authoritative local state.

When the user explicitly asks to perform the recommendation, the named owning
skill must establish its own authority and verification. Next's observation
does not grant mutation authority.
