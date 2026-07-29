# Reengineering execution contract

This contract lets `scd-reengineering` consume an approved `scd-project` graph
without changing Project into a scheduler or widening one QuickDev lane across
multiple Delivery Issues.

## Execution authority

Execution may start only when:

- the user approved the exact Initiative graph revision and materialized
  Delivery Issue contracts;
- the live graph validates;
- at least one node is READY;
- the compatibility envelope, target contracts, and required architecture are
  ready for those nodes;
- license, security, privacy, data, and production human gates do not block the
  selected work.

Direction approval or Initiative creation alone does not authorize execution of
unspecified nodes.

## Non-substitution rules

The following evidence classes are not interchangeable:

- session-local tasks, todos, or checklists are not GitHub Issues;
- a local plan, memory, or receipt is not the Initiative;
- an implementation package list is not a validated dependency DAG;
- a commit or direct default-branch push is not a QuickDev lane or pull request;
- local engineering checks are not fresh-context acceptance;
- an implementer's completion summary is not integration evidence.

If a required tracker or Thinloop dependency is unavailable, classify the
affected transition as `BLOCKED`. Do not substitute a weaker local artifact.

## Validate the pre-execution receipt

Immediately before the first implementation edit or commit, construct this
transient snapshot from re-read live tracker evidence:

```json
{
  "schemaVersion": 1,
  "phase": "GRAPH_APPROVED",
  "initiative": {
    "issue": 100,
    "url": "https://github.com/owner/repo/issues/100"
  },
  "graphRevision": 3,
  "trackerVerified": true,
  "graphValidated": true,
  "directionApproval": "direct user approval evidence",
  "graphApproval": {
    "revision": 3,
    "evidence": "direct approval of graph revision 3"
  },
  "requiredSkills": {
    "scdProject": "available",
    "scdQuickdev": "available"
  },
  "deliveryIssues": [
    {
      "nodeId": "baseline-harness",
      "issue": 101,
      "url": "https://github.com/owner/repo/issues/101",
      "state": "READY"
    }
  ],
  "readyWave": ["baseline-harness"],
  "blockers": []
}
```

Run:

```bash
node skills/scd-reengineering/scripts/validate-execution-receipt.mjs \
  --file <transient-receipt.json>
```

The validator proves only that the receipt is structurally executable. The
executor must obtain every field from live URLs, the graph validator, available
skill discovery, and direct approval; never fill a field from assumption. Do
not commit the receipt or persist it as a second execution database.

Any validation error is fail-closed. Report `BLOCKED`, preserve the exact
error, and return to the owning state. Rebuild and revalidate the receipt before
each new READY wave because graph and Issue state may have changed.

## Build a READY wave

Recompute states from live GitHub evidence. Begin with the deterministic READY
set from `scd-project`, then apply temporary coordination constraints:

- overlapping file or module ownership;
- shared generated files or lockfiles;
- one mutable fixture, database, service, device, or external environment;
- likely merge conflicts that would make concurrent evidence unreliable;
- host concurrency limits.

Coordination constraints may serialize otherwise READY nodes, but they are not
hard causal dependencies and must not be written into the Project DAG as fake
edges.

Choose the smallest useful wave. Serial execution is valid when isolation is
unavailable.

## Launch isolated lanes

For every node in a parallel wave:

1. create a dedicated branch and isolated worktree from the synchronized base;
2. assign exactly one Delivery Issue;
3. state explicit file or module ownership;
4. tell the worker that other agents are active and it must preserve and adapt
   to their changes rather than reverting them;
5. invoke `scd-quickdev` with the Initiative, graph revision, Issue, ready
   architecture/contracts, and baseline fixtures;
6. require task-local tests, complete diff review, a pull request, and the
   normal independent fresh-context verifier;
7. prohibit sibling Issue implementation, cross-lane staging, production
   mutation, acceptance weakening, or direct pushes to the default branch.

Bound the wave by available agent slots and repository policy. Do not spawn
background work that the parent cannot observe and reconcile.

## Merge and unlock

Pull requests may be developed in parallel, but merge them one at a time:

1. confirm the lane still targets the current Issue and graph revision;
2. wait for required checks and independent acceptance;
3. merge an eligible pull request;
4. synchronize the base branch;
5. update or rebase remaining worktrees safely;
6. rerun checks affected by the merged shared state;
7. close the Delivery Issue only under its QuickDev acceptance contract;
8. rebuild and validate the Project graph to compute the next READY wave.

A merge that invalidates a sibling's assumptions pauses that lane for rebase,
reinspection, and reverification. Do not treat concurrent green checks against
different base commits as assembled-system evidence.

## Failure and replanning

Classify each lane:

- `PASS` - independent acceptance passed and delivery can complete;
- `FAIL` - acceptance was exercised and failed;
- `BLOCKED` - required evidence, authority, dependency, or environment is
  unavailable.

On FAIL or BLOCKED:

- stop downstream nodes;
- keep unrelated READY lanes running only when their contracts and evidence are
  unaffected;
- record the direct evidence on the Delivery Issue;
- return changed behavior to Discovery, changed boundaries to Architecture, and
  changed nodes or edges to Project;
- require a new approved graph revision when topology or product contracts
  change.

Do not add retries, broaden scope, or weaken parity automatically.

## Integration and parity gate

Use a dedicated integration Delivery Issue whenever independently accepted
children do not prove the assembled outcome. It normally depends on all target
leaf capabilities and owns:

- assembled build and runtime evidence;
- cross-capability workflows;
- differential baseline replay;
- migration and coexistence checks;
- rollback rehearsal where activated;
- the final capability-by-capability PASS/FAIL/UNVERIFIED/BLOCKED report.

The integration verifier must use the assembled current base, not child branch
artifacts or the implementer's summary.

## Resume after interruption

Reconstruct execution state from:

- the Initiative and validated graph revision;
- live Delivery Issue state and acceptance evidence;
- open and merged pull requests;
- current branches and worktrees;
- compatibility and integration evidence in authoritative Issues.

Do not infer DONE from a branch, commit, checked implementation task, or merged
pull request alone. Do not create a second long-lived execution database.
