---
name: scd-next
description: "Inspect the current repository's live project state and recommend the single next action. Use when the user asks what is done, in progress, unfinished, READY, PLANNED, or blocked; asks for Issue, pull-request, Initiative, or milestone status; or does not know how to continue or resume. Read GitHub Issues, pull requests, Initiative DAGs, acceptance evidence, branches, worktrees, and local Thinloop state as available. Work for both multi-Issue Initiatives and ordinary Issue-backed repositories. Remain read-only by default: do not create or edit Issues, mutate a graph, start implementation, merge, or invent priority, percentage completion, or acceptance."
---

# SCD Next

Turn a vague “what should I do now?” into one evidence-backed continuation
without making the user reconstruct project state or choose a Thinloop skill.

Next is a proactive read-only inspection pass when invoked. It is not a
background notifier, daemon, scheduler, project database, or implementation
loop.

Maintain these boundaries:

- `scd-next` observes live project state and recommends one next action;
- `scd-project` creates or revises Initiative, Delivery Issue, and dependency
  graph contracts;
- `scd-execute` selects and runs safe READY waves from an approved Initiative;
- `scd-quickdev` delivers exactly one selected Issue;
- the authoritative tracker and acceptance contracts decide completion.

## Select the scope

Use an Initiative, Issue, pull request, or milestone named by the user. When no
scope is named, resolve it from current evidence in this order:

1. the Issue or pull request linked to the current branch;
2. the active Thinloop task and its governing Issue or Initiative;
3. the only open Initiative in the repository;
4. the repository's ordinary open Issues and pull requests.

If several Initiatives or milestones are equally plausible, show the compact
candidate list and ask one scope question. Do not silently choose based on
recency, issue number, or title wording.

When the user has already selected an Issue and explicitly asked for
implementation, do not run a status-only pass first. Route directly to the
owning delivery skill.

## Inspect live project truth

Read applicable repository instructions before interpreting state. Then inspect
the repository-authoritative tracker and enough supporting evidence to answer:

- the default branch and current branch or worktree;
- open and closed Issues in scope, their labels, dependencies, milestones, and
  explicit priority;
- open, merged, and closed pull requests tied to those Issues;
- the Initiative body, approved graph revision, Delivery Issues, and
  integration gate when an Initiative exists;
- required checks, review, independent acceptance, and human gates;
- local branches, worktrees, commits, and `.scd/tasks/current.md` only as
  supporting evidence.

Read `references/status-contract.md` before classifying or recommending work.
For an Initiative, validate the live graph with `scd-project`'s validator when
the graph payload is available. Do not report derived READY or DONE state from
an invalid or stale graph.

If the authoritative tracker cannot be read, report `UNVERIFIED`, name the
missing source, and limit the answer to facts that were actually observed.
Never promote local hints into remote completion evidence.

## Classify the current work

Place each in-scope item in exactly one user-facing class:

- `DONE` - the governing completion contract is satisfied by authoritative
  closure and required acceptance evidence;
- `IN_FLIGHT` - an open pull request or active Issue-linked lane has direct
  evidence of ongoing delivery, but is not yet DONE;
- `READY` - an approved materialized Issue has all hard dependencies DONE and
  no remaining gate;
- `PLANNED` - intended work is named but its executable Issue contract or
  approval has not been materialized;
- `BLOCKED` - a named dependency, decision, authority, environment, failed
  check, or human gate prevents progress;
- `UNVERIFIED` - the required authoritative evidence is unavailable or
  contradictory.

Do not infer DONE from a commit, branch, merged pull request, checked task, or
agent summary alone. Do not infer IN_FLIGHT merely from a stale branch. Keep a
named integration or release gate separate from independently completed child
Issues.

Exact counts such as `2/6 Delivery Issues DONE` are allowed only when the full
live scope and classification are known. Never fabricate effort, time, or
percentage completion.

## Recommend exactly one next action

Choose the next action from explicit dependency, priority, and readiness
evidence:

| Observed state | Recommendation |
| --- | --- |
| One or more safe Initiative nodes are `READY` | Use `scd-execute` for the current safe READY wave. |
| The user selected one `READY` Delivery Issue | Use `scd-quickdev` for that Issue. |
| Remaining Initiative work is only `PLANNED` | Use `scd-project` to review and approve the next exact Issue contracts and graph revision. |
| An ordinary Issue is explicitly highest priority and unblocked | Use `scd-quickdev` for that Issue. |
| Product behavior or acceptance remains undecided | Use `scd-discovery`. |
| A shared technical boundary remains undecided | Use `scd-architecture`. |
| A human or external gate blocks work | Name the owner and exact input or approval required. |
| Every required item and integration gate is `DONE` | Report completion; recommend no implementation action. |

When several READY ordinary Issues have no explicit ordering evidence, say
`priority not established`, list the tied candidates, and ask the user to
choose. Do not manufacture a single recommendation by guessing priority.

Separate what the agent can do next from what the user must do. If no user
intervention is needed, say so explicitly.

## Report the navigation snapshot

Keep the response compact and include only applicable sections:

```text
Project: <repository / Initiative / graph revision>
Checked: <authoritative sources and observation time>
DONE: <items and evidence>
IN_FLIGHT: <items and evidence>
READY: <items and dependency evidence>
PLANNED: <items and missing materialization or approval>
BLOCKED: <items, reason, and owner>
UNVERIFIED: <missing or contradictory evidence>
Recommended next: <exactly one action, or no implementation action>
Why: <direct evidence>
User action: <none, or exact decision / approval / input>
Copy-ready continuation: <one concrete Thinloop prompt>
```

Omit empty state sections, but never omit `Recommended next`, `Why`, or
`User action`. Include identifiers and links when the tracker provides them.
The copy-ready continuation must carry the relevant repository, Initiative or
Issue identifier, graph revision when applicable, and the owning Thinloop
skill.

Do not create or update Issues, comments, labels, milestones, project graphs,
branches, worktrees, commits, pull requests, or local state during the
inspection. If the user asks Next to perform the recommendation, hand off to
the named skill under that skill's authority; the read-only invocation itself
does not authorize the mutation.

## Resources

- `references/status-contract.md` - evidence authority, state classification,
  recommendation order, and output requirements.
