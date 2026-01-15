# Plan Status: DRAFT

## Implementation Phases
- Phase 0 — Spec lock: finalize P1, P2, P8, P9 definitions.
- Phase 1 — Foundations: schema, auth/invites, YouTube sync + transcript ingest.
- Phase 2 — Core loop: player, editor, runtimes, resume.
- Phase 3 — AI + chat: Nio prompt, context builder, streaming.
- Phase 4 — Analytics + admin: events, dashboard, share/feedback tracking.
- Phase 5 — QA + release: E2E coverage, CI/CD alignment.

## P1 — Success Metrics & Funnels
Phase: 0
Dependencies: none
Tasks:
- Finalize KPI formulas, denominators, and sessionization rules.
- Define activation and retention windows, plus share/feedback metrics.
- Map each KPI to required events.
Deliverables:
- Metrics glossary and KPI formulas embedded in docs.
- Event-to-KPI mapping aligned to ADR-002.

## P2 — YouTube Sync Model (Mirror CS50)
Phase: 0 → 1
Dependencies: none
Tasks:
- Map playlist → course, video → lesson, chapter → timestamped segments.
- Ingest official CS50 SRT transcripts from Harvard source URLs; map each SRT to the correct lesson.
- Parse SRT into timestamped segments and store in Convex with source URL.
- Define sync cadence, retries, and failure handling.
Deliverables:
- YouTube + transcript ingestion spec.
- Transcript source URL list, mapping rules, and failure policy.

## P3 — Admin Cockpit MVP (Analytics‑First)
Phase: 4
Dependencies: P1, P6, P8
Tasks:
- Define cockpit layout and KPI card ordering.
- Define share + feedback counters and queries for analytics panel.
- Define invite management UI (create/revoke/status).
- Define filter behaviors and time-range presets (start with 1d/7d/30d).
Deliverables:
- Admin cockpit UX spec (see `docs/specs.md`).
- KPI query list for dashboard cards.

## P4 — Nio Persona & Anti‑Drift Rules
Phase: 3
Dependencies: P2, P8, P9
Tasks:
- Draft system prompt and refusal rules.
- Define context builder inputs: lesson metadata, time window, code snapshot, transcript snippet.
- Define tests for tone, refusal, and context fidelity.
Deliverables:
- System prompt + guardrails spec.
- Context builder contract + test checklist.

## P5 — PRD vs Spec Scope Boundaries
Phase: 0 → 1
Dependencies: none
Tasks:
- Create ADR for CI/CD, scripts, and infra choices.
- Keep PRD product-level and stable.
Deliverables:
- ADR for CI/CD + scripts (ADR‑004).

## P6 — Instrumentation Plan
Phase: 1 → 4
Dependencies: P1, P8
Tasks:
- Implement event logger and session tracking rules.
- Emit share/feedback events from UI actions.
- Enforce privacy constraints for analytics payloads.
Deliverables:
- Event emission map tied to user flows.
- Sessionization rules + QA checklist.

## P7 — C Runtime Spike + Fallback Gate
Phase: 2
Dependencies: P2
Tasks:
- Spike TCC-in-WASM and measure warm-up + run latency.
- Implement fallback UX if perf fails.
Deliverables:
- Spike report with go/no-go decision.
- Runtime fallback UX spec.

## P8 — Data Model / Convex Schema
Phase: 0 → 1
Dependencies: P2
Tasks:
- Implement schema from ADR-002 (including transcripts).
- Lock indexes, access rules, and core tables.
- Define seed/sync pipeline for CS50 content + transcripts.
Deliverables:
- Convex schema + index list.
- Seed/sync spec for courses, lessons, transcripts.

## P9 — Error + Security Model
Phase: 0 → 2
Dependencies: P2, P4, P8
Tasks:
- Map failure modes to explicit UI states.
- Add transcript ingest failure handling.
- Enforce role checks, invite TTL, rate limits, and boundary validation.
Deliverables:
- Error-state UX map.
- Security checklist aligned to ADR-003.
