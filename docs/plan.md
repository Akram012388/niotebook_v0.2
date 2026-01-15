# Plan Status: FROZEN

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
- Finalize KPI formulas, denominators, and sessionization rules (30m inactivity, 60s heartbeat).
- Define activation and retention windows, plus share/feedback metrics.
- Define lesson completion trigger (video ≥80% OR ≥1 successful code run).
- Define cohort = inviteBatchId and analytics timezone = UTC.
- Map each KPI to required events.
Deliverables:
- Metrics glossary and KPI formulas embedded in docs.
- Event-to-KPI mapping aligned to ADR-002.

## P2 — YouTube Sync Model (Mirror CS50)
Phase: 0 → 1
Dependencies: none
Tasks:
- Enumerate slugs from https://cs50.harvard.edu/x/weeks/ and validate CS50x 2026 pages.
- Parse each week page to extract SRT (Subtitles), TXT (metadata only), and YouTube ID; no hardcoded CDN URLs.
- Ingest SRT into transcriptSegments (segment-per-row) and store transcript metadata on lessons.
- Set transcriptStatus (ok|warn|missing|error); warn on duration mismatch >120s; emit transcript ingest events.
- Deploy-only ingest with idempotent re-ingest (delete+reinsert per lessonId + ingestVersion).
Deliverables:
- YouTube + transcript ingestion spec.
- Transcript source URL list, mapping rules, and failure policy.
- Idempotent ingest + transcript status rules.

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
- Reference ADR-005 system prompt and refusal rules.
- Define context builder inputs: lesson metadata, time window, code snapshot, transcript snippet.
- Enforce token budget (4096 total, 1024 response).
- Define tests for tone, refusal, and context fidelity.
Deliverables:
- ADR-005 system prompt + guardrails.
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
- Emit transcript ingest events and duration warnings.
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
- Implement schema from ADR-002 (lessons transcript metadata + transcriptSegments).
- Lock indexes, access rules, and core tables.
- Define seed/sync pipeline for CS50 content + transcriptSegments.
Deliverables:
- Convex schema + index list.
- Seed/sync spec for courses, lessons, transcriptSegments.

## P9 — Error + Security Model
Phase: 0 → 2
Dependencies: P2, P4, P8
Tasks:
- Map failure modes to explicit UI states.
- Add transcript ingest failure handling and mismatch warn threshold (>120s).
- Enforce role checks, invite TTL (7 days), rate limits, and boundary validation.
- Define AI fallback triggers (5xx/429 or timeout ≥10s).
Deliverables:
- Error-state UX map.
- Security checklist aligned to ADR-003.
