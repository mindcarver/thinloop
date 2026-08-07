# Interview-question contract

Use this reference while deciding what is eligible, how answers should be
grounded, and how existing questions change.

## Purpose

The store is study material for the human: interview questions with reference
answers. This differs from `scd-knowledge`, which captures lessons that change a
later agent decision. A capture may draw on the same conversation, but the two
stores never share an entry.

## Eligibility

A candidate must satisfy both tests:

1. **Askability:** an interviewer could reasonably ask this about the discussed
   material, and the question tests understanding rather than plain recall.
2. **Grounding:** the reference answer is supported by what the conversation
   actually discussed or decided, or by a named artifact (code, test, run) that
   was in view.

Sources that usually yield candidates:

- a decision with tradeoffs ("Why X over Y?");
- a root cause and the diagnosis path that found it;
- a mechanism, architecture, or design pattern explained or applied;
- a failure mode, edge case, or performance/security consideration surfaced;
- a tooling or framework gotcha the conversation hit.

Reject:

- plain facts an interviewer would not probe and the conversation did not deepen;
- pure process narration or conversation summaries;
- unsupported claims — an answer the conversation could not support;
- personal, private, or confidential content;
- generic advice that names no mechanism.

## Reference answers

- Ground every answer in what was actually said, decided, or observed. Where the
  conversation only touched a topic, say so and give the entry point rather than
  fabricating depth.
- Capture the mechanism, the tradeoff, or the evidence — the part an interviewer
  listens for — not the full transcript.
- Preserve the human's own explanation when they gave one; it is an attributable
  source.
- Mark genuinely uncertain or version-dependent behavior as such instead of
  asserting it.

## Tags and difficulty

- Tags: 1-4 technology topics (`python`, `async`, `postgres`, `git`, ...).
- Difficulty: `basic`, `medium`, or `advanced`, judged by what the conversation
  showed.

## Deduplication and conflict

Compare the question's substance, not its wording.

- Same substance already saved -> skip the duplicate.
- Near-duplicate differing only in phrasing -> propose a single edited entry.
- Same mechanism, different or conflicting answer -> surface the conflict and let
  the user choose, rather than silently overwriting.

## Safety

Before presenting or writing a draft, remove credentials, tokens, passwords,
cookies, authentication headers, private keys, secret environment values,
sensitive connection strings, direct personal contact or identity data, and
irrelevant absolute user paths. Retain variable names, placeholders, and
repository-relative paths. If sanitization removes the point of the question,
reject the write and explain why.

## Storage

The personal root defaults to `<user-home>/.scd/interview-questions/`,
overridable by `interview_root` in `<user-home>/.scd/config.json` or by an
explicit path in the request. A question entry is one Markdown file; `INDEX.md`
keeps one line per active entry; superseded entries move to `archive/` and leave
`INDEX.md`. Never stage, commit, or push the personal store.
