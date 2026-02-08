# Docs Changelog

## 2026-02-08

- Redesign v2 merged to main — warm terracotta palette, full design token system (`1d8214f`).
- Public branding assets updated to v2 palette (`fc71c25`).
- Mobile viewport gate: restrict mobile access to landing and info routes only (`8c7325b`).
- `/info` route added, consolidating all footer content into a single page (`8659078`).
- CI: align claude-code-review workflow with main for OIDC validation (`93914f6`).

## 2026-02-07

- Chat UX overhaul: StreamingText component with RAF char-reveal, live markdown, ChatGPT-style streaming with lerp scroll and pulse dot (`21db3e8`, `fa86491`).
- Canvas 2D thinking orb with terracotta heartbeat pulse for AI chat (`232f8e2`).
- Admin console redesigned to match v2 design system — snapshot feedback cards, email on cards (`d91c8a4`).
- Workspace redesigned — unified terracotta accent for all active/selected states, shared ThemeToggle (`59484f5`).
- Courses layout refactored — SiteNav shared component replaces SidebarShell (`b0c3e87`).
- Phase 8 route redesign: sidebar shell, sign-in redesign, course detail cards merged into redesign-v2 (`93e8459`, `4eec59b`).
- Figma Brand Plugin v2.0 — complete brand system rewrite with design tokens, dual-theme swatches, and asset export (`79dcad2`).
- Complete brand asset library exported from Figma (`e465f90`).
- Landing demo video: Remotion project with 4K 60fps intro animation (`b237ee9`, `a1f6187`).
- Landing hero rework (`418f0f8`).
- Agent infrastructure: added `/orchestrate-agent-team` and `/execution-pro` slash commands.

## 2026-02-04

- Mobile sign-in card overflow fix (`0c40ed0`).

## 2026-02-03

- AI system prompt generalized and cursor theme updated (`f18721b`).
- Admin dashboard metrics — real-time KPI cards (`e4f21e6`).

## 2026-02-02

- Brand system: color tokens, workspace theme, Clerk font integration, and app brand alignment (`0370035`, `859fc0c`, `ac9d68e`, `74d9373`).
- Course detail page premium redesign (`187f5a4`).
- Resume cards upgrade (`88f0401`).
- Landing interactive enhancements (`ff0163d`).
- Workspace interface bug fixes (`b4382bd`).
- UX polish: landing, sign-in, courses, workspace (`f40dd60`).

## 2026-02-01

- R & SQL language support added to code editor (`6b22a06`).
- CS50R course added, video ID corrections for CS50AI, CS50P, CS50W (`6e41940`).
- Code/terminal error fixes (`0b790f2`).
- Course search and catalog improvements (`9e7f981`).
- Chat interface polish (`d6a207e`).
- Workspace UX polish (`60807f9`).
- Course mismatch fix and video playback position preservation (`5000079`).

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

## 2026-01-30

- Docs alignment tag: `auth-e2e-docs-alignment-2026-01-30`.
