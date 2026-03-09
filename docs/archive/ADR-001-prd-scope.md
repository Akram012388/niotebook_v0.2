# ADR Status: DRAFT

## Title

Keep PRD product-level; move implementation details to Spec/ADR

## Context

The v0.2 PRD currently mixes product requirements with implementation-specific details (CI/CD, infra tooling, runtime choices). This creates drift risk and forces product documents to change for technical reasons.

## Decision

- The PRD will stay product-level (problem, user, goals, scope, UX, success metrics).
- Implementation details (CI/CD, infra, runtime packs, build commands, deployment flow) live in Specs and ADRs.
- Any new technical decision that affects architecture or tooling is captured in an ADR, not the PRD.

## Consequences

- PRD remains stable and readable for product/funding discussions.
- Specs/ADRs can evolve without forcing PRD edits.
- Plan steps and implementation PRs must reference ADRs when introducing tooling changes.

## Related Docs

- `docs/PRD.md`
- `docs/specs.md`
- `docs/plan.md`
