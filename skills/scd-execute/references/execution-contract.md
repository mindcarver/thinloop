# Execute contract

This contract lets `scd-execute` consume an approved `scd-project` graph while
keeping Project non-executing and every QuickDev lane limited to one Delivery
Issue.

## Authority

Execution may start only when:

- the Initiative and exact graph revision are approved;
- the live graph validates from repository-authoritative tracker evidence;
- at least one materialized Delivery Issue is `READY`;
- applicable product, UX, architecture, and machine contracts are ready;
- repository and human gates do not block the selected work.

A direct request to start, continue, resume, or finish that Initiative selects
the default safe READY wave and later waves on the same approved graph
revision. A material scope, acceptance, permissions, data, privacy, interface,
or graph change requires the owning approval before affected execution resumes.

## Default and overridden wave selection

Start from the complete deterministic READY set. The default wave contains all
safely independent READY nodes up to available concurrency and repository
policy.

The user may narrow this with one Issue, an explicit Issue list, serial
execution, or a maximum parallel count. Never expand beyond the requested
subset.

Before launch, serialize nodes that conflict through:

- overlapping file or module ownership;
- shared generated files or lockfiles;
- one mutable fixture, database, device, service, or external environment;
- repository policy or unavailable worktree isolation;
- merge risk that would make concurrent evidence unreliable.

These are temporary coordination constraints, not hard causal prerequisites.
Do not add them to the Project DAG.

## Live execution snapshot

Immediately before every wave, establish this transient evidence:

```json
{
  "initiative": 100,
  "graphRevision": 3,
  "graphApproved": true,
  "graphValidated": true,
  "ready": ["api", "ui"],
  "selectedWave": ["api", "ui"],
  "coordinationDeferred": [],
  "blockers": []
}
```

Every field comes from the live Initiative, Delivery Issues, graph validator,
repository state, available capacity, and direct user override when present.
Keep it transient; do not commit it or persist it as a second state database.

## Lane contract

Every parallel lane has:

- one approved READY Delivery Issue;
- one Issue-linked branch and isolated worktree from the synchronized base;
- explicit file or module ownership;
- the current Initiative and graph revision;
- applicable product and technical contracts;
- one `scd-quickdev` invocation;
- its own pull request, repository checks, independent `REVIEW_PASS`, and
  behavioral acceptance `PASS`.

A lane must not implement sibling Issues, stage another lane's files, weaken
acceptance, push directly to the default branch, mutate production, or infer
authority from another lane.

The parent Execute session remains observable and owns coordination. Detached
background work that cannot be monitored and reconciled is not an execution
lane.

## Serial merge protocol

Parallel development does not authorize parallel merges. For each eligible
pull request:

1. re-read the live Issue, graph revision, checks, and acceptance evidence;
2. merge one pull request;
3. synchronize the default branch;
4. rebase or update remaining lanes safely;
5. rerun evidence affected by the new base;
6. close the Issue only under QuickDev's contract;
7. rebuild and validate the graph before selecting more work.

Pause and reverify any sibling whose assumptions changed. A lane's earlier
green result is stale when the merged base materially changes its behavior or
verification seam.

## Failure and blocking

`FAIL` means acceptance ran and violated the Issue contract. `BLOCKED` means
required authority, dependency, environment, isolation, or evidence is
unavailable.

For either result:

- record direct evidence on the Delivery Issue;
- stop downstream nodes;
- preserve unrelated READY work only when its contract and evidence are
  unaffected;
- return product changes to Discovery, shared technical changes to
  Architecture, and graph changes to Project;
- require approval of a changed graph revision before affected execution.

Do not hide failure with retries, expanded scope, fake DAG edges, or weakened
acceptance.

## Integration gate

When child completion does not prove assembled behavior, the Initiative must
contain an integration or release Delivery Issue. It becomes executable only
through the graph and runs through one QuickDev lane against the assembled
current base.

Project completion requires every required child `DONE`, a valid current graph,
and integration acceptance where specified.

## Resumption

Reconstruct state from:

- the Initiative and approved graph revision;
- live Delivery Issues and acceptance evidence;
- open and merged pull requests;
- current branches and worktrees;
- the synchronized default branch.

Do not infer `DONE` from a branch, commit, checked task, merged pull request, or
implementer summary alone. Do not create a durable scheduler database.
