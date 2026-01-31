# Docs Changelog

## 2026-01-30

- Docs alignment tag: `auth-e2e-docs-alignment-2026-01-30`.

## 2026-01-31

- Docs alignment tag: `code-editor-fix-docs-alignment-2026-01-31`.
- Updated code editor Tier 2 plan, UI reference, specs, plan, PRD, and ADR-003 to match current workspace behavior.
- E2E workflow: skip runs when Vercel payload is missing a ref to avoid falling back to main.
- Local e2e: allow preview deploy key from `CONVEX_PREVIEW_DEPLOY_KEY`.
- E2E workflow: run preview deployments for any ref to satisfy required checks.

- Alpha launch roadmap added to `plan.md` (5 workstreams: core fixes, courses route, admin console, content expansion, testing).
- PRD updated: status DRAFT → ACTIVE; added courses route, learning pulse, viewport policy, admin console, markdown chat, sign-in boot sequence to core loop and acceptance criteria.
- Specs updated: onboarding flow now routes through `/courses`; admin console section rewritten (invite/user/feedback/analytics management); learning pulse section added; CS50SQL added to alpha courses; markdown rendering for chat specified.
- UI/UX contract updated: added courses route, course detail page, sign-in terminal aesthetic, learning pulse context strip, viewport policy, expanded acceptance checklist.
- README updated: all docs listed with status labels and descriptions.
