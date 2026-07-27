# Shared interface contract

Use this reference whenever independently implemented consumers cross a
frontend, service, event, plugin, file, CLI, or module boundary.

## Contents

- [Ownership](#ownership)
- [Format and location](#format-and-location)
- [Semantic coverage](#semantic-coverage)
- [Examples and consumer use](#examples-and-consumer-use)
- [Compatibility and evolution](#compatibility-and-evolution)
- [Readiness](#readiness)

## Ownership

The shared interface contract is the common source of truth for every producer
and consumer. Architecture facilitates convergence; it does not invent product
semantics or own the result alone.

- The governing GitHub Issue owns allowed behavior and business meaning.
- Domain model owns invariants, lifecycle, and command authority.
- UX contract contributes visible data, operation, state, and error needs.
- Producers contribute feasibility, security, consistency, and operational
  constraints.
- Consumers confirm usability, examples, and compatibility.

Resolve conflicting terminology at the owning source. Do not keep two field or
error definitions and rely on prose to explain the difference.

## Format and location

Prefer the repository's existing contract format and location. When none
exists, create a visible root `contracts/` directory.

Select a canonical machine-readable form that actual tooling can consume:

| Boundary | Typical canonical form |
|---|---|
| HTTP API | OpenAPI |
| GraphQL | GraphQL SDL |
| Events or messaging | AsyncAPI and/or JSON Schema |
| Files or payloads | JSON Schema, XML Schema, Avro, or Protobuf |
| RPC | Protobuf or the framework's IDL |
| TypeScript module boundary | exported types plus runtime schema |
| CLI or plugin protocol | declared command/argument and payload schema |

These are defaults, not mandates. Use the repository's working convention when
it provides equal or stronger machine validation.

Architecture prose may explain rationale, trust, versioning, and trade-offs.
It must link the canonical contract rather than duplicate every field.

## Semantic coverage

Cover only activated semantics, including:

- stable operation or message identifiers;
- requests, responses, payloads, and field constraints;
- authentication, authorization, and tenant context;
- business and transport errors with stable machine identifiers;
- pagination, filtering, ordering, idempotency, and correlation;
- synchronous, asynchronous, partial, and delayed completion;
- nullability, absence, defaults, time, money, units, and identifiers;
- retries, duplicate delivery, ordering, and version where applicable.

An HTTP status alone is rarely a sufficient business error. Preserve the
distinction needed by approved behavior and UX recovery without leaking
database or internal exception names.

## Examples and consumer use

Add representative, non-sensitive examples for successful, empty, validation,
permission, conflict, partial, and dependency-failure behavior when activated.
Examples must validate against the canonical schema.

Use the contract for the strongest practical consumer evidence:

- generated types or clients;
- mock servers or fixtures;
- producer request and response validation;
- consumer-driven or schema compatibility tests;
- documentation generated from the canonical source.

Generated artifacts are derivatives. Do not hand-edit them as a second source
of truth.

## Compatibility and evolution

Before changing a shared contract:

1. identify every known producer and consumer;
2. classify the change as compatible, conditionally compatible, or breaking;
3. preserve old and new behavior long enough for affected consumers when
   necessary;
4. design versioning, feature negotiation, rollout order, observability, and
   rollback;
5. make data backfill or semantic migration explicit;
6. record removal conditions for deprecated behavior.

Do not call a change internal merely because the API is not public; another
module, job, client, or test may still depend on it.

## Readiness

A shared boundary is `ready` only when:

- its canonical contract is machine-readable;
- a format-aware tool actually parses, lints, or compiles it;
- representative examples validate when the format supports validation;
- operations, types, errors, permissions, and activated delivery semantics are
  explicit;
- approved product behavior and UX states map without contradiction;
- producers and consumers use the same identifiers and meanings;
- compatibility, migration, and rollback are resolved for breaking changes;
- no material item remains only in Markdown.

If the required parser, generator, or consumer check is unavailable, keep the
boundary `draft` and report it as unverified.
