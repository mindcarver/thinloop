# Visual evidence

Read this reference before creating or validating a wireframe, mockup, or
prototype.

## Choose fidelity by decision risk

| Situation | Smallest useful artifact |
|---|---|
| Clear copy, token, spacing, or local component delta | Written or annotated delta |
| Unclear hierarchy, navigation, form grouping, or responsive reflow | Low-fidelity wireframe |
| Stateful interaction, multi-step task, or recovery behavior | Clickable or runnable lightweight prototype |
| Brand, visual language, data density, or component appearance is acceptance-critical | High-fidelity key screens and states |

Fidelity is not project status. A 0-to-1 product may still need only a
wireframe; a focused redesign may need high fidelity.

## Select tools from the environment

Use the user's existing design source when available. Otherwise choose the
least expensive tool that makes the decision reviewable:

- a diagram or wireframe for structure;
- static mockups for visual comparison;
- Figma or another editable design tool when collaborative editing matters;
- a local HTML prototype when responsive behavior or interaction must be
  exercised.

Do not require a particular vendor. Do not add a production framework merely
to create a prototype.

## Keep prototypes non-production

Place prototypes in an existing design workspace or beside the UX artifact in
an explicitly non-production location. Avoid importing them into application
entry points, production builds, or runtime dependencies. Use representative,
non-sensitive sample data.

A prototype may demonstrate behavior but does not define backend endpoints,
security, persistence, or production architecture.

## Inspect instead of assuming

After producing or receiving a visual:

1. render or open it at the intended desktop and narrow Web viewports;
2. inspect hierarchy, clipping, wrapping, overflow, focus, contrast, and
   representative states;
3. exercise interactive paths when the artifact supports them;
4. compare it with the UX contract and source product behavior;
5. record observed gaps and revise the artifact or contract;
6. link the retained artifact from the relevant contract section.

Do not claim a visual has been reviewed because its file exists or a render
command exited successfully.

## Preserve decisions, not galleries

Retain a visual only when it communicates layout, hierarchy, behavior, or
appearance that downstream work needs. Name what each retained artifact proves.
Remove or clearly mark superseded alternatives so frontend work does not choose
between conflicting references.

The written UX contract is authoritative when a visual contains incidental or
stale details. Update both when the visual exposes a genuine product or
experience decision.
