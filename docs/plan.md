# Plan Status: DRAFT

## P1 — Success Metrics & Funnels
- Define PMF metrics: onboarding conversion %, median active session length, D1/D7 retention.
- Define activation (north star): invite redeemed → lesson started → 1 code run + 1 Nio message within 24h.
- Define early‑alpha activation proxy: invite redeemed → lesson started + (code run OR Nio message OR ≥8 min active time).
- Define “active”: ≥1 meaningful action or ≥5 min active time.
- Enumerate funnel events (invite issued, invite redeemed, magic link verified, course selected, lesson started, code run, Nio message, lesson completed).
- Define retention windows (D1/D7).

## P2 — YouTube Sync Model (Mirror CS50)
- Map playlist → course, video → lesson, chapter → timestamped segments.
- Define sync cadence and failure handling.
- Define stored fields: course metadata, lesson metadata, chapter timestamps, source links, license info.
- Confirm no manual overrides in v0.2 (mirror CS50 exactly).

## P3 — Admin Cockpit MVP (Analytics‑First)
- Define minimal dashboard: invite redemption %, activation %, D1/D7 retention, median active session length, lesson completion rate, AI engagement rate.
- Define time‑range selector and cohort filters (invite cohort, course/lesson).
- Define read‑only admin capabilities for v0.2 (no curriculum editing).

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
