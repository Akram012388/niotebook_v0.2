# Guidelines non-negotiables (short, enforceable):

- Any plan step must have an ID: P1, P2, …
- Any implementation PR must reference plan step IDs.
- Builder must refuse requests that don’t cite step IDs (prevents “random build drift”).

- “Functional core, imperative shell” boundaries:
  - src/domain/** no I/O, no framework imports.
  - src/infra/** adapters only.
  - UI is src/ui/**, Next routes src/app/**.

- TypeScript rules (strict):
  - any is forbidden (no exceptions).
  - unknown is forbidden.
  - Prefer type aliases over interface unless declaration merging is required.
  - Every function must have an explicit return type.

- Naming conventions:
  - camelCase for variables/functions/params.
  - PascalCase for types/classes/components.
  - SCREAMING_SNAKE_CASE for true constants only.
  - Boolean names start with is/has/can/should.
  - Event handlers start with handle.
  - Event props start with on.
  - Pure transformers start with toX/fromX/mapX/reduceX.

# These strong instructional guidelines give you mechanical guardrails without adding complexity.
