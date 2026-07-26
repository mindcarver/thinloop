# Decision-tree interviewing

Use this reference for full discovery. Depth comes from resolving consequential decisions, not from asking a fixed number of questions.

## Start from a provisional understanding

Open with:

- what the product appears to achieve;
- facts already established from the repository or environment;
- the single most upstream unresolved decision.

Do not ask broad prompts such as "What are all your requirements?" when a sharper decision is available.

## Shape one decision

A useful turn contains:

1. **Decision:** the one choice currently blocking downstream understanding.
2. **Why now:** which later behavior depends on it.
3. **Recommendation:** the preferred answer.
4. **Rationale:** evidence, product trade-off, or reversibility.
5. **Alternatives:** only choices that produce meaningfully different outcomes.
6. **Question:** one decision requested from the user.

A turn may contain context and several facts, but it must request only one decision.

## Follow dependency order

Ask upstream questions before their consequences. For example:

```text
single user or team
├─ single user
│  └─ local only or multi-device
└─ team
   ├─ organization membership
   ├─ roles and permissions
   └─ data ownership after departure
```

Do not batch all branches before the parent decision exists.

## Cover activated surfaces

Every delivery needs a clear outcome, primary user, main journey, boundary, and observable acceptance. Expand other surfaces only when activated:

- **Rules and states:** transitions, invariants, duplicate actions, cancellation.
- **Failure and recovery:** empty states, partial success, retry, offline or dependency failure.
- **Data:** source, owner, persistence, retention, deletion, migration.
- **Permissions:** actor, visibility, authority, irreversible actions.
- **Integrations:** trust boundary, rate limits, failure, fallback, vendor lock-in.
- **Constraints:** platform, compatibility, privacy, latency, cost, regulation.
- **Non-goals:** tempting adjacent capabilities excluded from this delivery.
- **Verification:** the UI, API, CLI, file, database state, event, or other seam that proves behavior.

Stop a branch when its answer would not change observable behavior, acceptance, irreversible risk, or an expensive-to-reverse choice.

## Keep epistemic state explicit

- **Fact:** verified from the repository, environment, or an authoritative source.
- **Confirmed decision:** explicitly chosen or accepted by the user.
- **Assumption:** temporarily adopted with a named risk.
- **Deferred decision:** excluded now with a condition for reopening it.
- **Open decision:** unresolved and capable of changing the delivery contract.

Never silently promote an inference into a user decision.

## Challenge without taking control

For a new product, confirm the user, problem, and desired change before treating the proposed solution as final. Challenge a questionable solution assumption once with a concrete reason and recommendation.

Do not demand market proof, force competitor research, or repeatedly ask "why." Once the user confirms the solution form, treat it as a constraint.

The model owns investigation, dependency ordering, recommendations, and contradiction detection. The user owns product trade-offs.

## Converge periodically

After three to five consequential decisions, summarize:

- confirmed;
- assumed;
- deferred or out of scope;
- the next unresolved decision.

Keep the summary short. It is a drift check, not another approval gate.
