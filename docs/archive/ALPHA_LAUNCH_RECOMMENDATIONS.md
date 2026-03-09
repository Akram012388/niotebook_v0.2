# Alpha Launch Recommendations for niotebook v0.2

**Date:** February 3, 2026
**Reviewer:** Claude Opus 4.5
**Status:** Plan Mode Analysis

---

## Executive Summary

Niotebook v0.2 is an impressively architected AI-native learning workspace with **strong foundations** ready for alpha. Phases 1-4 are complete with 151 passing unit tests, clean typecheck, and comprehensive documentation. The codebase demonstrates excellent separation of concerns (app → ui → domain → infra) and production-ready patterns.

**Current Readiness:** All implementation phases complete (Redesign v2 merged 2026-02-08). Remaining gap is operational readiness (E2E activation, visual QA, content pipeline verification).
**Estimated Gap:** Focused polish and operational verification

---

## Critical Path Items (P0 — Must Complete)

### 1. E2E Test Activation & Data Seeding

**Current State:** 10 E2E tests skipped pending seeded data
**Impact:** Cannot validate complete user journeys without this

**Actions:**

- [ ] Run CS50 ingest script against your Convex deployment
- [ ] Create E2E seed data via `scripts/e2eSeed.ts`
- [ ] Setup admin role user for admin page E2E tests
- [ ] Unskip and verify all 10 E2E tests pass

**Files:**

- `scripts/ingest-cs50-courses.ts`
- `scripts/e2eSeed.ts`
- `tests/e2e/*.e2e.ts`

### 2. Visual QA Pass

**Current State:** All features wired but not visually reviewed in-browser
**Impact:** Users will encounter unpolished UI

**Critical Views to Review:**

- [ ] `/courses` — Card grid layout, responsive behavior (CourseCarousel was removed; replaced by card grid)
- [ ] `/courses/[courseId]` — Progress bars, lecture list ordering
- [ ] `/workspace` — Pane layouts, resizing, terminal integration
- [ ] `/admin` — Dashboard tables, KPI cards, data visualization
- [ ] Sign-in page — BootSequence animation alongside Clerk card
- [ ] AiPane — Context strip visibility and accuracy
- [ ] ControlCenterDrawer — Share/feedback flow UX

### 3. Content Pipeline Verification

**Current State:** Ingest scripts ready, may not be deployed
**Impact:** Empty courses page for new users

**Actions:**

- [ ] Verify all 5 CS50 courses appear in `/courses`
- [ ] Test lesson loading in workspace for each course type
- [ ] Validate environment presets match course content (C for CS50x weeks 1-5, Python for later)
- [ ] Check transcript availability for representative lessons
- [ ] Verify resume functionality across lessons

---

## High Priority Improvements (P1 — Should Complete)

### 4. API Documentation Gap

**Current State:** No OpenAPI/Swagger spec for `/api/nio`
**Impact:** Harder for future developers to understand AI chat contract

**Recommendations:**

- Create `/docs/api-reference.md` documenting:
  - SSE event types (`meta`, `token`, `done`, `error`)
  - Request/response schemas
  - Error code reference table
  - Rate limit behavior (20 req/10 min)
- Consider generating OpenAPI spec from route types

### 5. Error Handling Enhancement

**Current State:** Some generic error messages; no structured logging
**Impact:** Difficult to debug issues in production

**Improvements:**

```typescript
// Current: "Provider stream error."
// Better: "Gemini stream error: timeout after 10s. Falling back to Groq."
```

**Actions:**

- [ ] Add retry suggestions to error messages
- [ ] Implement structured logging (consider Pino)
- [ ] Add timestamps to console logs
- [ ] Create user-friendly error banners for common failures

### 6. Performance Optimization Opportunities

**File:** `convex/lessonCompletions.ts`
**Issue:** `getCompletionsByCourse()` may have N+1 query pattern

```typescript
// Current: Sequential lesson iteration
for (const lesson of lessons) {
  const completion = await ctx.db.query("lessonCompletions")...
}

// Better: Batch query with Promise.all
const completions = await Promise.all(
  lessons.map(lesson => ctx.db.query("lessonCompletions")...)
);
```

**Other Optimizations:**

- [ ] Add caching layer for transcript resolution (currently 3-layer fallback)
- [ ] Profile Pyodide/WASM warm-up times
- [ ] Consider lazy loading for CodeMirror extensions

### 7. Input Validation Hardening

**File:** `src/app/api/nio/route.ts`
**Issue:** Request size and message length unbounded

**Actions:**

- [ ] Add max request body size (suggest: 500KB)
- [ ] Limit `userMessage` length (suggest: 10,000 chars)
- [ ] Validate `recentMessages` array depth
- [ ] Add rate limiting per IP for unauthenticated requests

---

## Medium Priority Improvements (P2 — Consider for Alpha)

### 8. Accessibility Audit

**Good:** Skip-to-content links present
**Needs Review:**

- [ ] Keyboard navigation through course cards
- [ ] Screen reader announcements for streaming chat
- [ ] Focus management in modal drawers
- [ ] Color contrast in terminal themes
- [ ] ARIA labels on icon-only buttons

### 9. Mobile Experience Polish

**Current:** `/workspace` desktop-only (≥1024px)
**Opportunity:** Improve the "friendly message" for mobile users

**Suggestions:**

- [ ] Add clear CTA to return on desktop
- [ ] Allow course browsing on mobile (already planned)
- [ ] Consider read-only transcript view for mobile

### 10. Analytics Dashboard Enhancement

**Current:** KPI cards with basic metrics
**Improvements:**

- [ ] Add date range selector beyond 1d/7d/30d
- [ ] Export functionality (CSV for metrics)
- [ ] Trend lines on charts
- [ ] Lesson-level engagement heatmap

### 11. Monitoring & Observability

**Current:** Sentry for errors
**Additions:**

- [ ] Add performance monitoring (Sentry Performance or Vercel Analytics)
- [ ] Create Convex scheduled function for health checks
- [ ] Add uptime monitoring for AI provider endpoints
- [ ] Create alert for fallback rate exceeding threshold

---

## Architectural Recommendations (P3 — Post-Alpha)

### 12. Consider Rate Limit Tiering

**Current:** Flat 20 req/10 min for all users
**Future:** Tier by plan (free vs paid alpha testers)

```typescript
// Suggested structure
const rateLimits = {
  free: { requests: 20, window: "10m" },
  alpha: { requests: 50, window: "10m" },
  admin: { requests: 100, window: "10m" },
};
```

### 13. Wasmer/C Runtime Completion

**Current:** Static analysis only, "C placeholder" documented
**Action:** Complete Wasmer bridge for actual C compilation

**Files:**

- `src/infra/runtime/wasmer/WasmerBridge.ts`
- `src/app/editor-sandbox/page.tsx`

**Note:** This is explicitly called out as post-alpha in your docs

### 14. Code Snapshot Versioning

**Opportunity:** Expose code version history to users

**Current:** Snapshots stored but not surfaced
**Future:** "Version history" panel showing progression

### 15. Offline Capability Exploration

**Current:** Out of scope for v0.2
**Future Consideration:**

- Service worker for course/lesson metadata
- IndexedDB already used for VFS — extend for offline code editing
- Queue chat messages for sync when online

---

## Security Checklist

### Already Implemented ✅

- [x] Prompt injection neutralization (12 regex patterns)
- [x] Role-based access control (admin/user/guest)
- [x] JWT validation with Clerk → Convex
- [x] IP-based rate limiting for invites
- [x] User-scoped data isolation
- [x] Dev auth bypass requires env check

### Verify Before Alpha

- [ ] Ensure `NIOTEBOOK_DEV_AUTH_BYPASS` cannot leak to production
- [ ] Verify rate limit bypass is not possible via header manipulation
- [ ] Test admin route protection with non-admin JWT
- [ ] Validate transcript fallback doesn't expose API keys
- [ ] Review Wasmer iframe sandbox CSP headers

---

## Testing Gaps to Address

### Unit Tests — Missing Coverage

- [ ] Markdown rendering component tests
- [ ] Admin mutation edge cases (concurrent role changes)
- [ ] Runtime executor timeout handling
- [ ] VFS edge cases (max file size, nested paths)

### E2E Tests — Expansion Ideas

- [ ] Resume flow: leave workspace → return → verify state
- [ ] Chat: send message → verify streamed response → verify markdown
- [ ] Multi-language: switch languages → verify context updates
- [ ] Error states: simulate provider failure → verify fallback

### Integration Tests — Consider Adding

- [ ] Full AI flow with mocked provider
- [ ] Transcript resolution fallback chain
- [ ] Rate limit enforcement end-to-end

---

## Documentation Recommendations

### Current Strengths

- 24 comprehensive markdown docs
- ADR pattern well-established (5 ADRs)
- HANDOFF.md excellent for session continuity
- Clear phase-based execution plans

### Additions for Alpha

- [ ] **User Guide** — Brief onboarding doc for alpha testers
- [ ] **Known Limitations** — Transparent list of alpha constraints
- [ ] **Feedback Process** — How to report issues, expected response time
- [ ] **API Reference** — As mentioned in P1
- [ ] **Troubleshooting Guide** — Common issues and solutions

---

## Deployment Checklist

### Pre-Launch

- [ ] Verify all environment variables set in Vercel
- [ ] Confirm Convex production deployment configured
- [ ] Test Clerk invite flow end-to-end
- [ ] Generate initial invite codes for alpha testers
- [ ] Verify Sentry is receiving errors
- [ ] Run full E2E suite against preview deployment

### Launch Day

- [ ] Deploy to production
- [ ] Send first batch of invites
- [ ] Monitor error rates in Sentry
- [ ] Watch AI fallback rates in analytics
- [ ] Be ready to adjust rate limits if needed

### Post-Launch Monitoring

- [ ] Daily check of active users vs sessions
- [ ] Weekly review of feedback submissions
- [ ] Monitor Gemini/Groq API costs
- [ ] Track lesson completion rates

---

## Prioritized Action Plan

### Week 1 — Foundation

1. Run CS50 ingest against Convex
2. Activate and verify all E2E tests
3. Complete visual QA pass
4. Deploy to preview and test

### Week 2 — Polish

1. Address P1 improvements (error handling, input validation)
2. Write API reference documentation
3. Create alpha user guide
4. Security checklist verification

### Week 3 — Launch

1. Final E2E pass on production
2. Generate invite codes
3. Deploy to production
4. Send invites to alpha testers
5. Begin monitoring

---

## Metrics to Track Post-Alpha

| Metric            | Target          | Measurement                    |
| ----------------- | --------------- | ------------------------------ |
| Activation Rate   | >60%            | Sign up → First lesson started |
| Session Duration  | >15 min         | Average time in workspace      |
| Return Rate (D7)  | >40%            | Users returning within 7 days  |
| AI Usage          | >3 msgs/session | Chat messages per session      |
| Lesson Completion | >20%            | Lessons marked complete        |
| Error Rate        | <1%             | Errors / total requests        |
| Fallback Rate     | <10%            | Groq fallback / AI requests    |

---

## Summary

**Strengths:**

- Excellent architecture and code organization
- Comprehensive test coverage (151 unit tests)
- Strong documentation culture
- Production-ready patterns (SSE streaming, fallback, rate limiting)
- Clear separation of concerns

**Key Gaps for Alpha:**

1. E2E test activation (blocked on data seeding)
2. Visual QA pass (never done in-browser)
3. Content pipeline verification
4. API documentation
5. Error message polish

**Recommendation:** Focus the next 2 weeks on the Critical Path (P0) items. The architecture is solid — what's needed is operational readiness and polish.

---

_This analysis was generated in Plan Mode. No code changes were made._
