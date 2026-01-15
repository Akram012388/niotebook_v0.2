# Plan Status: DRAFT

## P1 — Success Metrics & Funnels
- Define PMF metrics: invite redemption %, onboarding conversion %, activation %, median active session length, D1/D7 retention.
- Define invite redemption rate = invite_redeemed / invite_issued.
- Define onboarding conversion = lesson_started / magic_link_verified.
- Define activation (north star) = activated_users / magic_link_verified; activation = lesson_started + 1 code run + 1 Nio message within 24h.
- Define early‑alpha activation proxy: invite redeemed → lesson started + (code run OR Nio message OR ≥8 min active time).
- Define D1/D7 retention = active users on day 1/7 after activation / activated_users.
- Define “active”: ≥1 meaningful action or ≥5 min active time.
- Define session length: time between first and last meaningful action; session ends after 30m inactivity.
- Enumerate meaningful actions (lesson start, video play/seek, code edit/run, Nio message).
- Enumerate funnel events (invite issued, invite redeemed, magic link verified, course selected, lesson started, code run, Nio message, lesson completed).

## P2 — YouTube Sync Model (Mirror CS50)
- Map playlist → course, video → lesson, chapter → timestamped segments.
- Define sync cadence and failure handling.
- Define stored fields: course metadata, lesson metadata, chapter timestamps, source links, license info.
- Confirm no manual overrides in v0.2 (mirror CS50 exactly).

## P3 — Admin Cockpit MVP (Analytics‑First)
- Alpha: minimal dashboard (invite redemption %, activation %, D1/D7 retention, median active session length, lesson completion rate, AI engagement rate).
- Capture full event data for deep analysis; dashboard stays minimal until beta.
- Define time‑range selector and cohort filters (invite cohort, course/lesson) for beta.
- Define admin capabilities for v0.2: invite management + analytics; no curriculum editing.

## P4 — Nio Persona & Anti‑Drift Rules
- Persona: Nio UI name; backend persona modeled on Prof. David Malan (humble, gentle, super‑smart, encouraging).
- Strict, narrow focus on current lesson/time window/code; refuse off‑topic.
- Define system prompt rules and enforcement checks (tests/guards).

## P5 — PRD vs Spec Scope Boundaries
- Keep PRD product‑level; move implementation detail to Spec/ADR.
- Create ADR to house CI/CD + infra details (Sentry/Semgrep/Vercel/Convex/TCC).

## P6 — Instrumentation Plan
- Define event taxonomy and storage (Convex schema or analytics layer).
- Define data retention, privacy flags, and minimal dashboard queries.
- Ensure all events tie back to P1 metrics.

## P7 — C Runtime Spike + Fallback Gate
- Implement TCC-in-WASM spike to validate performance.
- Acceptance: <500ms compile+run after warm-up; <100ms perceived switch latency.
- Fallback if perf fails: syntax highlight + “C runtime warming up” notice.

## P8 — Data Model / Convex Schema
- Reference ADR: `docs/ADR-002-schema.md`.
- Draft Convex schema and relationships.
- Lock indexes, access rules, and core tables.

## P9 — Error + Security Model
- Reference ADR: `docs/ADR-003-error-security.md`.
- Enumerate failure modes and degradation paths.
- Define invite validation, role enforcement, and prompt-injection guards.
