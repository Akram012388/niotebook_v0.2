# ADR Status: ACCEPTED

## Title

Architecture Layer Contract: domain / infra / ui separation

## Context

Niotebook v0.2 grew quickly and accumulated several cases where framework concerns leaked into the wrong layer:

- `RuntimeLanguage` type is defined in `src/infra/runtime/runtimeConstants.ts` but is consumed by prompt-building logic in `src/domain/`.
- Some `src/domain/` files import from `src/infra/` to access shared types, creating upward coupling.
- The VFS design was undocumented, making it unclear whether VFS state belongs in domain or infra.

Without a clear, enforced layer contract these violations compound over time and make the codebase harder to test and reason about.

## Decision

Three layers with explicit coupling rules:

**`src/domain/`** — Pure business logic and types.

- Zero framework dependencies (no React, no Convex, no Next.js imports).
- No side effects. No I/O.
- May only import from other `domain/` modules or pure utility libraries.
- `unknown` is forbidden here (enforced by `bun run check:unknown`).

**`src/infra/`** — Infrastructure implementations.

- Implements interfaces declared in `domain/` or introduces purely infrastructural abstractions.
- May import from `domain/` but `domain/` must never import from `infra/`.
- Allowed to use Zustand, IndexedDB, browser APIs, and external SDKs.
- No React components or hooks. Infrastructure is framework-agnostic glue.

**`src/ui/`** — React presentation layer.

- All React components and hooks live here.
- May import from both `domain/` and `infra/`.
- No business logic that belongs in `domain/`.

### RuntimeLanguage placement

`RuntimeLanguage` is a domain concept — it represents a language the system can execute and is used in prompt construction and lesson configuration. It must live in `src/domain/` (e.g. `src/domain/runtime.ts`), not in `src/infra/runtime/`. Infra executors import this type from domain; the direction of coupling must not be reversed.

### VFS design rationale

The Virtual Filesystem (`src/infra/vfs/`) is intentionally an infrastructure concern:

- The in-memory tree is a pure data structure that could be a domain type, but its persistence (IndexedDB) and reactivity (Zustand) are infrastructure concerns that dominate its usage.
- Keeping VFS in `infra/` avoids coupling `domain/` to browser storage APIs.
- Domain code that needs to reason about file paths or language detection operates on plain string types passed from the infra layer, not on VFS store references.

## Consequences

- Prompt-building logic in `domain/` can import `RuntimeLanguage` without crossing layer boundaries.
- Infra and UI layers remain independently testable: domain tests require no mocks of browser APIs or React.
- New contributors have a clear rule: if it has a side effect or framework import, it is not domain code.
- Existing violations (e.g. `RuntimeLanguage` in `infra/`) are tracked in `docs/REMEDIATION_PLAN.md` as `ARCH-01`.

## Related Docs

- `docs/REMEDIATION_PLAN.md`
- `docs/ADR-001-prd-scope.md`
- `src/domain/` source tree
- `src/infra/runtime/runtimeConstants.ts`
