# Guidelines non-negotiables (short, enforceable):

- Any plan step must have an ID: P1, P2, …

- Any implementation PR must reference plan step IDs.

- Builder must refuse requests that don’t cite step IDs (prevents “random build drift”).

    - “Functional core, imperative shell” boundaries:

    - src/domain/** no I/O, no framework imports.

    - src/infra/** adapters only.

    - UI is src/ui/**, Next routes src/app/**.

# These strong instructional guidelines gives you mechanical guardrails without adding complexity.
