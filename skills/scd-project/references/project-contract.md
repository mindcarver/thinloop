# Project contract

Use this contract for multi-delivery project decomposition. It extends, but does
not replace, the single-Issue Discovery and QuickDev contracts.

## Authority boundaries

| Artifact | Authoritative for |
|---|---|
| Initiative Issue | Project outcome, shared decisions, graph topology, project acceptance |
| Delivery Issue | One slice's requirements, boundaries, acceptance, and verification seams |
| Pull request and verifier evidence | Implementation, engineering checks, and delivery proof |
| Validated graph snapshot | A derived readiness view of the live tracker state |

Do not copy full child acceptance into the Initiative or make a local project
file authoritative. The Initiative links to child Issues; each child remains
self-contained for QuickDev.

## Initiative Issue

After explicit approval, create or update one Initiative:

````markdown
## Outcome

## Users and problem

## Project boundaries

### In

### Out

## Shared language and invariants

## Shared decisions and contracts

## Project failure and edge cases

## Project acceptance

- [ ] P1: <observable cross-slice outcome>

## Delivery graph

```json
{
  "schemaVersion": 1,
  "revision": 1,
  "nodes": [
    {
      "id": "first-delivery",
      "issue": null,
      "contract": "planned",
      "delivery": "open",
      "humanGate": "clear",
      "dependsOn": [],
      "blockers": ["materialize the approved Delivery Issue"]
    }
  ]
}
```

## READY now

- None

## Integration or release gate

- Not required: <evidence>, or
- Node: <node-id> / Issue #<number>

## Assumptions

## Deferred deliveries

## Replanning log

- Revision 1: <what changed and why>
````

Omit empty optional sections. Keep the JSON block machine-readable and free of
comments. The Initiative is the canonical owner of graph topology.

## Delivery Issue

Every executable graph node is one approved Delivery Issue:

```markdown
## Outcome

## User problem

## Project coordination

- Initiative: #<number>
- Node: `<stable-kebab-case-id>`
- Graph revision: <positive integer>
- Depends on: none, or #<number>, ...
- Contract: APPROVED
- Current graph state: READY, BLOCKED, or DONE

## In scope

## Out of scope

## Confirmed decisions

## Failure and edge cases

## Acceptance

- [ ] A1: <observable behavior>

## Verification seams

## Implementation tasks

- [ ] To be refined by QuickDev after repository inspection

## Verification

- A1: Not run

## Unknowns

- None
```

The current graph state is a mirrored coordination value. Recompute it from the
live Initiative and Issue evidence before relying on it. QuickDev must refuse
an Initiative, a PLANNED placeholder, or a BLOCKED Delivery Issue as an
implementation source. Preserve stable acceptance identifiers when the graph
revision changes.

## Graph snapshot

Validate this JSON shape with `scripts/validate-project-graph.mjs`:

```json
{
  "schemaVersion": 1,
  "revision": 3,
  "nodes": [
    {
      "id": "shared-contract",
      "issue": 101,
      "contract": "approved",
      "delivery": "done",
      "humanGate": "clear",
      "dependsOn": [],
      "blockers": []
    },
    {
      "id": "user-journey",
      "issue": 102,
      "contract": "approved",
      "delivery": "open",
      "humanGate": "clear",
      "dependsOn": ["shared-contract"],
      "blockers": []
    },
    {
      "id": "later-admin-tools",
      "issue": null,
      "contract": "planned",
      "delivery": "open",
      "humanGate": "clear",
      "dependsOn": ["user-journey"],
      "blockers": ["product rules not approved"]
    }
  ]
}
```

Fields:

- `schemaVersion`: must be `1`;
- `revision`: positive integer incremented when project nodes, dependencies, or
  shared decisions change;
- `id`: unique stable kebab-case node ID;
- `issue`: positive GitHub Issue number, or `null` only while PLANNED;
- `contract`: `planned` or `approved`;
- `delivery`: `open` or `done`;
- `humanGate`: `clear` or `waiting`;
- `dependsOn`: unique node IDs representing hard causal prerequisites;
- `blockers`: explicit unresolved blockers not represented by dependency edges.

The snapshot contains no implementation tasks, branch state, hidden reasoning,
credentials, or secrets. Unknown top-level or node fields fail validation.

## Deterministic states

The validator derives states in this order:

1. `DONE`: delivery is `done` and the contract is approved;
2. `PLANNED`: contract is not yet approved;
3. `BLOCKED`: a human gate is waiting, an explicit blocker remains, or any
   dependency is not DONE;
4. `READY`: approved Issue with no remaining blocker and all dependencies DONE.

An approved node must have an Issue number. PLANNED placeholders cannot enter
QuickDev. A merged pull request alone does not make a node DONE; use the
QuickDev independent-acceptance and Issue-closure contract. A DONE node whose
hard dependency is not DONE is an invalid snapshot, not a valid completion
state.

Run the validator with a file:

```bash
node skills/scd-project/scripts/validate-project-graph.mjs \
  --file /path/to/project-graph.json
```

Or pipe a temporary snapshot through standard input. Do not persist the
temporary snapshot as another requirements source.

## Approval and materialization

One explicit project approval may cover the exact Initiative revision and exact
Delivery Issue contracts shown in the approval summary. It does not approve
unspecified future work.

- Materialize an approved slice as a Delivery Issue.
- Keep an immature future slice PLANNED or deferred.
- Promote PLANNED to approved only after its outcome, boundary, acceptance, and
  verification seams are reviewed.
- Keep a human-gated node BLOCKED until the required approval exists.
- Do not interpret project approval as permission to implement every child.

## Integration and release nodes

Add an integration or release Delivery Issue when individual child acceptance
cannot prove the complete project behavior. Treat it as a normal node whose
dependencies are the applicable leaf nodes.

Its acceptance should exercise external seams across the assembled system,
such as end-to-end behavior, migrations, shared-contract compatibility,
observability, or release readiness. Never infer project PASS by aggregating
child checkboxes.

## Replanning

Before any readiness report:

1. re-read the Initiative and affected Delivery Issues;
2. confirm live QuickDev acceptance and closure evidence for DONE nodes;
3. rebuild and validate the graph snapshot;
4. update the Initiative graph revision and affected child coordination fields;
5. request approval only for changed product contracts;
6. report READY nodes and exact BLOCKED reasons.

Do not maintain a second long-lived execution state. A future external executor
must reconstruct its view from the same Initiative, Delivery Issues, pull
requests, and verifier evidence.

## Explicit non-goals

This contract does not define:

- an execution loop or scheduler;
- automatic agent, branch, worktree, pull-request, merge, or deployment actions
  by Project itself;
- concurrency slots, leases, retries, or distributed locks;
- file-, function-, or checklist-task dependency graphs;
- more than one QuickDev implementation lane for one Delivery Issue.

An external skill may consume this graph only under its own approved execution
contract. `scd-reengineering` is the supported consumer for an approved
project-scale refactor or reimplementation Initiative; Project itself remains
non-executing.
