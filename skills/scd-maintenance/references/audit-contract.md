# Maintenance audit contract

Use this contract for broad repository audits and any claim that code,
documentation, specifications, or architecture disagree.

## Establish authority

Classify each side of a conflict before recommending a repair:

1. **Normative contract:** an explicitly approved product specification,
   public schema, compatibility policy, ADR, security rule, or regulatory
   requirement. This states what must be true.
2. **Executable behavior:** runtime behavior, tests, manifests, generated
   schemas, migrations, and tool output. This proves what is currently true.
3. **Descriptive material:** READMEs, tutorials, examples, diagrams,
   screenshots, and explanatory comments. This claims what is true.

A newer or executable artifact is not automatically authoritative. Code can
violate an approved specification; a test can preserve a bug; a document can
describe intended behavior that has not been implemented. When authority
cannot be resolved from repository evidence, report the conflict and request a
product decision before repair.

## Use the smallest useful taxonomy

- `behavior-drift` - approved or documented behavior differs from observed
  behavior.
- `interface-drift` - API, CLI, configuration, schema, migration, or
  environment contracts disagree.
- `documentation-drift` - instructions, examples, links, screenshots, or
  named symbols no longer match the product.
- `architecture-drift` - actual dependencies, ownership, or data flow violate
  an explicit architecture rule.
- `verification-debt` - a material contract has no credible automated or
  named manual verification path.
- `dead-artifact` - code, dependency, document, feature flag, compatibility
  path, or generated artifact is provably unreferenced or obsolete.
- `maintenance-risk` - an explicit debt marker, unsupported dependency,
  recurring failure, duplication, or complexity has observable maintenance
  cost but does not fit a stronger category.

Do not invent a category merely to make a report look comprehensive.

## Assign severity

- **Critical:** credible immediate risk of data loss, security compromise,
  irreversible behavior, or unusable recovery instructions.
- **High:** public behavior, compatibility, permissions, migration safety, or a
  primary user journey is materially wrong.
- **Medium:** maintainers or users are likely to waste time, choose a wrong
  integration, or preserve a significant structural violation.
- **Low:** confirmed local debt with limited current impact.

Severity measures impact, not cleanup effort. A large refactor can be Low; a
one-line dangerous instruction can be Critical.

## Assign confidence

- **Confirmed:** directly reproduced or proven by a deterministic check.
- **High:** multiple repository facts support the conclusion with no material
  contradiction.
- **Medium:** plausible and actionable, but one authority or reachability fact
  remains unverified.
- **Lead:** worth investigating but not eligible for a repair claim.

Keep leads out of confirmed finding counts.

## Require evidence

Support a finding with at least one of:

- an observed failing command or runtime interaction;
- a parser, compiler, linter, schema, dependency, or documentation check;
- a direct comparison of two named artifacts;
- a reachability or reference result from an appropriate repository tool;
- an explicit repository policy plus the violating code.

File age, commit age, model opinion, and "this could be cleaner" are not
evidence of debt.

## Keep scans bounded

For a large repository:

1. start with public and normative surfaces;
2. inspect changed or high-churn areas when the user supplied a range;
3. follow references to direct producers and consumers;
4. run language-specific tools only where their manifests apply;
5. state excluded packages and checks that were unavailable.

Never hide a partial scan behind the phrase "repository-wide".
