# Niotebook Build: Architecture & Roadmap

> **Status:** Approved by Founder (Akram) — February 9, 2026
> **Branch:** `feat/niotebook-build` (on niotebook_v0.2 — plan document only)
> **New Repo:** `niotebook_v0.3` — fresh monorepo, built from scratch
> **Decision:** Full Variant C from Day 0 — no phased compromise

---

## Vision

**From:** watch.code.learn (IDE workspace for learners)
**To:** LEARN.BUILD.SHARE (holistic platform bridging understanding and building)

Niotebook Build is the **BUILD layer** — a full-stack vibe coding environment powered by an autonomous AI agent, running inside hardware-isolated sandboxes. It is the hook that sits between LEARN (Focus mode) and SHARE (future iOS/macOS apps). If Build is extraordinary, the flywheel spins. If Build is mediocre, everything collapses.

---

## Repository Strategy: niotebook_v0.3

### Why a new repo?

- **v0.2 stays running as-is** — the alpha is live, gaining traction, zero disruption
- **Fresh monorepo architecture** designed for LEARN.BUILD.SHARE from day one
- **Shared types eliminate drift** — Nio bridge types, brand tokens, auth helpers are packages imported by both apps
- **Unified CI/CD** — clean, efficient pipelines designed for multi-app architecture
- **Single checkout** — Claude Code hops directories instead of switching workspaces
- **Symbolic of the evolution** — new system, new phase, new architecture

### What happens to v0.2?

- `niotebook_v0.2` repo is **archived on GitHub** as reference (git history preserved)
- Its codebase is imported into `niotebook_v0.3/apps/focus/` (no git history carried over — clean start)
- The alpha deployment continues running from v0.2 until v0.3 is ready for cutover
- Bug fixes to the live alpha go to v0.2; v0.3 gets them during import or as manual ports

### Monorepo Structure

```text
niotebook_v0.3/
│
├── apps/
│   ├── focus/                    ← Focus mode (imported from niotebook_v0.2)
│   │   ├── src/
│   │   │   ├── app/              (Next.js App Router routes)
│   │   │   ├── ui/               (React components by feature)
│   │   │   ├── domain/           (pure business logic, no React)
│   │   │   └── infra/            (VFS, runtime, AI, niotepad stores)
│   │   ├── public/
│   │   ├── next.config.ts
│   │   ├── postcss.config.mjs
│   │   ├── tsconfig.json         (extends ../../tsconfig.base.json)
│   │   └── package.json          (app-specific deps: next, react, zustand, etc.)
│   │
│   └── build/                    ← Build mode (forked from bolt.diy)
│       ├── app/                  (Remix routes + components)
│       │   ├── components/
│       │   │   ├── chat/         (36 chat UI components — KEEP)
│       │   │   ├── workbench/    (14 IDE components — KEEP)
│       │   │   ├── editor/       (CodeMirror 6 — KEEP)
│       │   │   └── ui/           (42 design system components — KEEP)
│       │   ├── lib/
│       │   │   ├── runtime/      (ActionRunner — REPLACE WebContainer calls)
│       │   │   ├── stores/       (20 Nanostores — MODIFY files.ts)
│       │   │   ├── .server/llm/  (Vercel AI SDK integration — KEEP)
│       │   │   └── common/       (prompts — REWRITE for OpenHands+E2B)
│       │   └── routes/           (Remix routes + API endpoints)
│       ├── vite.config.ts
│       ├── tsconfig.json         (extends ../../tsconfig.base.json)
│       └── package.json          (app-specific deps: remix, nanostores, @e2b/sdk, etc.)
│
├── packages/
│   ├── nio-shared/               ← Shared Nio Intelligence types & contracts
│   │   ├── src/
│   │   │   ├── types.ts          (NioContext, LearningProfile, ConceptMastery, etc.)
│   │   │   ├── api-contracts.ts  (Focus ↔ Build API shapes)
│   │   │   └── embeddings.ts     (vector schema for transcript segments)
│   │   ├── tsconfig.json
│   │   └── package.json          (name: @niotebook/nio-shared)
│   │
│   ├── brand/                    ← Shared brand tokens & assets
│   │   ├── src/
│   │   │   ├── tokens.ts         (colors, fonts, spacing — consumed by both apps)
│   │   │   ├── logos/            (SVG wordmark, icons)
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json          (name: @niotebook/brand)
│   │
│   └── auth/                     ← Shared Clerk auth config & helpers
│       ├── src/
│       │   ├── clerk-config.ts   (shared Clerk publishable key, domain config)
│       │   ├── middleware.ts     (auth middleware helpers for both frameworks)
│       │   └── index.ts
│       ├── tsconfig.json
│       └── package.json          (name: @niotebook/auth)
│
├── convex/                       ← Shared Convex backend (SINGLE deployment)
│   ├── schema.ts                 (unified schema — existing + new Nio bridge tables)
│   ├── nio/                      ← NEW: Nio Intelligence bridge functions
│   │   ├── getUserLearningProfile.ts
│   │   ├── getUserBuildHistory.ts
│   │   ├── getConceptRecommendation.ts
│   │   └── syncBuildContext.ts
│   ├── ...existing functions     (courses, users, admin, etc.)
│   └── _generated/
│
├── infra/                        ← Deployment & infrastructure configs
│   ├── openhands/
│   │   ├── Dockerfile            (OpenHands Agent Server image)
│   │   ├── docker-compose.yml    (local dev: agent server + dependencies)
│   │   └── config.toml           (agent config: tools, models, security policies)
│   ├── e2b-template/
│   │   ├── e2b.Dockerfile        (custom sandbox: Node.js 22 + Python 3.12 + tools)
│   │   └── e2b.toml              (template config)
│   └── cloudflare/
│       └── wrangler.toml         (user app deployment config)
│
├── turbo.json                    ← Turborepo pipeline configuration
├── pnpm-workspace.yaml           ← Workspace definition
├── tsconfig.base.json            ← Shared TypeScript strict config
├── .github/workflows/            ← Fresh CI/CD
│   ├── ci.yml                    (lint + typecheck + test on PR)
│   ├── deploy-focus.yml          (deploy apps/focus to Vercel)
│   └── deploy-build.yml          (deploy apps/build to Vercel/Cloudflare)
├── .env.example                  ← All required env vars documented
├── CLAUDE.md                     ← Updated for monorepo (new commands, new paths)
└── package.json                  ← Root (devDeps: turbo, shared scripts)
```

### Upstream Tracking (bolt.diy)

The Build mode app is forked from bolt.diy. To track upstream improvements:

```bash
# Inside the monorepo, add bolt.diy as a remote for reference:
cd apps/build/
git remote add bolt-upstream https://github.com/stackblitz-labs/bolt.diy.git

# Periodically check upstream changes:
git fetch bolt-upstream
git log --oneline bolt-upstream/main --since="2 weeks ago"

# Cherry-pick valuable improvements (apply manually, not merge):
# Review the diff, adapt to our codebase, commit as our own change
```

Note: Since we copy bolt.diy into the monorepo (not git-subtree), upstream tracking
is manual and intentional. We cherry-pick what helps, ignore what doesn't.

### Local Reference Clones

For browsing OpenHands source code during development (not committed to repo):

```text
~/Learning/Projects/Niotebook/
├── niotebook_v0.2/              ← Archived alpha (reference only)
├── niotebook_v0.3/              ← Active monorepo (this plan)
└── .reference/                  ← Local clones for reading (gitignored globally)
    ├── bolt.diy/                (upstream bolt.diy for diffing)
    └── OpenHands/               (OpenHands source for API reference)
```

---

## Architecture: Variant C (Maximum Power)

```text
┌─────────────────────────────────────────────────────────┐
│                    build.niotebook.com                   │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │              UI Layer (Bolt.diy Fork)             │   │
│  │                                                  │   │
│  │  ┌────────┐ ┌──────────┐ ┌────────┐ ┌────────┐  │   │
│  │  │  Chat  │ │  Editor  │ │Preview │ │Terminal│  │   │
│  │  │  (36   │ │(CodeMir- │ │(iframe)│ │(xterm) │  │   │
│  │  │  comps)│ │  ror 6)  │ │        │ │        │  │   │
│  │  └───┬────┘ └────┬─────┘ └───┬────┘ └───┬────┘  │   │
│  │      │           │           │           │       │   │
│  │  ┌───▼───────────▼───────────▼───────────▼────┐  │   │
│  │  │           Nanostores (20 stores)           │  │   │
│  │  └──────────────────┬─────────────────────────┘  │   │
│  └─────────────────────┼────────────────────────────┘   │
│                        │                                │
│  ┌─────────────────────▼────────────────────────────┐   │
│  │          Agent Interface (abstraction)            │   │
│  │   Translates UI actions → Agent commands          │   │
│  │   Streams Agent events → UI updates               │   │
│  └─────────────────────┬────────────────────────────┘   │
│                        │                                │
│  ┌─────────────────────▼────────────────────────────┐   │
│  │          API Gateway (Remix BFF)                  │   │
│  │   Auth (Clerk) · Nio Context (Convex) · Billing   │   │
│  └─────────────────────┬────────────────────────────┘   │
│                        │                                │
└────────────────────────┼────────────────────────────────┘
                         │ HTTP + WebSocket
                         ▼
┌─────────────────────────────────────────────────────────┐
│              OpenHands Agent Server                      │
│                                                         │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐ │
│  │ Agent Loop   │  │ Tool Registry │  │ Condenser    │ │
│  │ (observe-act │  │ (Terminal,    │  │ (context     │ │
│  │  cycle)      │  │  FileEditor,  │  │  compression)│ │
│  │              │  │  Browser,MCP) │  │              │ │
│  └──────┬───────┘  └───────┬───────┘  └──────────────┘ │
│         │                  │                            │
│  ┌──────▼──────────────────▼─────────────────────────┐  │
│  │         Workspace Abstraction (BaseWorkspace)      │  │
│  │         → Routes to E2B Bridge                     │  │
│  └──────────────────────┬────────────────────────────┘  │
│                         │                               │
└─────────────────────────┼───────────────────────────────┘
                          │ REST + gRPC
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   E2B Runtime                           │
│              (Firecracker microVMs)                     │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Per-User Sandbox                               │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │    │
│  │  │ Full     │  │ Real FS  │  │ Dev Server   │  │    │
│  │  │ Node.js  │  │ (read/   │  │ (port 3000)  │  │    │
│  │  │ + Python │  │  write/  │  │ → preview URL│  │    │
│  │  │ + any    │  │  watch)  │  │ auto-exposed │  │    │
│  │  │ language │  │          │  │              │  │    │
│  │  └──────────┘  └──────────┘  └──────────────┘  │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │    │
│  │  │ Real     │  │ git,npm, │  │ Preview URL: │  │    │
│  │  │ bash     │  │ pip,etc  │  │ {port}-{id}  │  │    │
│  │  │ shell    │  │ all work │  │ .e2b.app     │  │    │
│  │  └──────────┘  └──────────┘  └──────────────┘  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  Startup: ~150ms  |  Isolation: Hardware (own kernel)   │
│  Cost: ~$0.05/hr  |  Session: up to 24hr (Pro)          │
└─────────────────────────────────────────────────────────┘
```

---

## Technology Decisions

### UI Layer: Bolt.diy Fork

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Source repo | `stackblitz-labs/bolt.diy` (19k stars) | Most complete browser-based vibe coding UI. MIT source. |
| What we keep | Chat (36 comps), Workbench (14 comps), Editor (CodeMirror 6), Terminal (xterm.js), FileTree, UI library (42 comps), Nanostores (20 stores), Vercel AI SDK, XML action parser | All runtime-agnostic. Zero WebContainer coupling. |
| What we remove | `@webcontainer/api`, WebContainer singleton, StackBlitz deploy UIs, Expo QR, starter templates, Electron wrapper | Proprietary runtime + StackBlitz-specific features |
| What we replace | `action-runner.ts` (~300 LOC), `files.ts` (~100 LOC), `webcontainer/index.ts`, `constants.ts`, system prompts | Swap WebContainer calls for Agent Interface calls |
| What we add | Clerk auth, Niotebook branding, Nio context bridge, deploy-to-Cloudflare pipeline | Integration with existing Niotebook infrastructure |

**Stack difference (acceptable — "different personality, same brand"):**

| | Focus Mode (apps/focus) | Build Mode (apps/build) |
|---|---|---|
| Framework | Next.js 16 (App Router) | Remix 2.15 + Vite |
| Styling | Tailwind CSS 4 | UnoCSS + SCSS modules |
| State | Zustand + Convex hooks | Nanostores |
| Editor | CodeMirror (existing) | CodeMirror 6 |
| Terminal | xterm (existing) | xterm.js |
| Auth | Clerk (existing) | Clerk (shared) |
| AI SDK | Custom SSE (`/api/nio/chat`) | Vercel AI SDK |

### Agent Layer: OpenHands

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Agent framework | OpenHands V1 SDK (67.6k stars, MIT) | Most capable autonomous agent. Devin-class reasoning. |
| Deployment | OpenHands Agent Server (self-hosted) | REST + WebSocket API. Per-user workspace isolation. |
| Agent capabilities | Terminal, FileEditor, Browser (Chromium), MCP tools, TaskTracker | Full autonomous engineering: debug, plan, browse docs, fix errors |
| LLM routing | RouterLLM (built into OpenHands) | Claude for complex reasoning, faster model for simple edits |
| Context management | LLMSummarizingCondenser | Handles long sessions without context overflow |
| Customization | AgentContext + Skill objects | Niotebook-specific system prompts, Nio awareness |
| Security | ConfirmationPolicy + LLMSecurityAnalyzer | Risk-level gating on destructive actions |

**OpenHands Agent Server API surface used:**

```text
POST   /workspaces                    # Create workspace for user session
DELETE /workspaces/{id}               # Cleanup on session end
POST   /conversations                 # Start a new conversation
POST   /conversations/{id}/messages   # Send user prompt
GET    /conversations/{id}/stream     # WebSocket: stream agent events to UI
GET    /health                        # Monitoring
```

### Runtime Layer: E2B

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Sandbox technology | E2B Firecracker microVMs | 150ms startup, hardware isolation, built-in preview URLs |
| SDK | `@e2b/sdk` (TypeScript, MIT) | Native TS, matches UI stack |
| Base template | Custom (Node.js 22 + Python 3.12 + common tools) | Pre-baked environment for fast startup |
| Preview URLs | Built-in (`https://{port}-{id}.e2b.app`) | Zero infrastructure, works immediately |
| File operations | gRPC streaming (real-time file watching) | First-class, bidirectional |
| Terminal | PTY streaming via gRPC | First-class, bidirectional |
| Session limits | 24hr max (Pro tier) | Sufficient for build sessions |
| Cost | ~$0.05/hr per sandbox | $150/mo base + usage |

**E2B SDK surface used (TypeScript):**

```typescript
import { Sandbox } from '@e2b/sdk';

// Lifecycle
const sandbox = await Sandbox.create('niotebook-template');  // ~150ms
await sandbox.kill();

// File operations
await sandbox.filesystem.write('/app/src/App.tsx', code);
const content = await sandbox.filesystem.read('/app/src/App.tsx');
const files = await sandbox.filesystem.list('/app/src/');
sandbox.filesystem.watch('/app/', (event) => { /* notify UI */ });

// Commands
const result = await sandbox.commands.run('npm install && npm run dev', { background: true });

// Preview
const previewUrl = sandbox.getHost(3000);  // → https://3000-{id}.e2b.app

// Terminal (PTY)
const pty = await sandbox.pty.start({ cols: 80, rows: 24 });
pty.onData((data) => { /* stream to xterm.js */ });
```

### Integration Layer: Shared Packages

| Package | Purpose | Consumed By |
|---------|---------|-------------|
| `@niotebook/nio-shared` | Nio types, API contracts, embeddings schema | Both apps + Convex functions |
| `@niotebook/brand` | Colors, fonts, logos, shared design tokens | Both apps |
| `@niotebook/auth` | Clerk config, auth middleware helpers | Both apps |

### Backend: Convex (Single Deployment)

| Service | How It's Shared |
|---------|----------------|
| **Existing functions** | Courses, users, admin — consumed by Focus mode (unchanged) |
| **New Nio bridge** | `convex/nio/` — Focus mode writes learning state, Build mode reads it; Build mode writes project state, Focus mode reads it |
| **Clerk Auth** | Both apps authenticate via the same Clerk instance → same Convex identity |
| **Billing** | Subscription state stored in Convex, gated in both apps |

---

## Data Flow: User Prompt → Running App

```text
1. User types: "Build me a todo app with drag-and-drop"
                    │
                    ▼
2. UI Layer (apps/build): Chat component captures input
   → Sends to API Gateway via WebSocket
                    │
                    ▼
3. API Gateway: Authenticates (Clerk), enriches with Nio context (Convex)
   → Forwards to OpenHands Agent Server
                    │
                    ▼
4. OpenHands Agent:
   a) PLAN — Creates Blueprint.md with architecture decisions
   b) ACT  — Generates file writes, shell commands via tools
   c) Each tool call → routed to E2B sandbox via Workspace abstraction
                    │
                    ▼
5. E2B Sandbox:
   a) Files written to real filesystem
   b) `npm install` runs in real bash
   c) `npm run dev` starts Vite dev server on port 3000
   d) Preview URL auto-exposed: https://3000-{id}.e2b.app
                    │
                    ▼
6. UI Layer:
   a) File changes stream back via gRPC → update Nanostores → Editor re-renders
   b) Terminal output streams via PTY → xterm.js
   c) Preview iframe loads E2B preview URL
   d) Agent reasoning displayed in chat as thinking/action annotations
                    │
                    ▼
7. User iterates: "Add dark mode and a settings page"
   → Agent observes current state, plans changes, executes
   → Live preview updates in real-time
                    │
                    ▼
8. User deploys: One-click → export project → deploy to Cloudflare Workers
```

---

## Subdomain Architecture

```text
niotebook.com                    build.niotebook.com
┌────────────────────┐           ┌────────────────────┐
│  Focus Mode        │           │  Build Mode         │
│  (apps/focus)      │  ◄─────►  │  (apps/build)      │
│                    │  shared   │                     │
│  Next.js 16        │  Clerk    │  Remix + Vite       │
│  Tailwind CSS 4    │  auth     │  UnoCSS + SCSS      │
│  Zustand + Convex  │    +      │  Nanostores         │
│  Watch.Code.Learn  │  Convex   │  Prompt.Build.Ship  │
│                    │    +      │                     │
│                    │  Brand    │                     │
└────────────────────┘           └────────────────────┘
        │                                │
        │       Shared (packages/)       │
        │  ┌──────────────────────────┐  │
        ├──│  @niotebook/nio-shared   │──┤
        ├──│  @niotebook/brand        │──┤
        └──│  @niotebook/auth         │──┘
           └──────────────────────────┘
        │                                │
        │       Shared (convex/)         │
        │  ┌──────────────────────────┐  │
        └──│  Convex backend          │──┘
           │  (single deployment)     │
           │  Nio bridge functions    │
           │  Clerk identity          │
           │  Billing state           │
           └──────────────────────────┘
```

**UX Transition:** Focus → Build feels like switching from "study desk" to "workshop." Different layout, different color accent, different tools. Unified by the Nio AI presence (persistent across both) and Niotebook brand identity.

**Navigation:** Toggle in the main navbar: `[ Focus | Build ]`
- On niotebook.com: clicking "Build" navigates to build.niotebook.com (preserves auth)
- On build.niotebook.com: clicking "Focus" navigates back to niotebook.com

---

## Target Customer

**Primary ICP (Ideal Customer Profile):**

**The Curious Vibe Coder** — Someone already using Bolt/Cursor/v0 who keeps hitting walls because they don't understand fundamentals. They WANT to learn but traditional courses bore them.

**The Aspiring Builder** — Someone who wants to build apps but hasn't started coding yet. Attracted to AI-powered building but intimidated by pure vibe coding tools.

**Why they pay for Niotebook:** No other platform bridges learning and building with a persistent AI that knows both sides. When they hit a wall in Build mode, Nio says "watch this 3-minute segment from MIT 6.006 to understand hash maps" — and suddenly the wall isn't a wall anymore.

---

## Revenue Model

| Tier | Price | What's Included |
|------|-------|----------------|
| **Free** | $0 | Focus mode (all courses, workspace, Nio chat with limits) |
| **Build** | $25-39/mo | Full Build mode access (prompt → build → deploy) |
| **Pro** | $49-69/mo | Focus + Build + priority Nio + extended sessions + more deploys |

**Benchmark context:** Cursor $20/mo, Replit $20/mo, Bolt $18/mo, Lovable $25-39/mo. Niotebook's combo (learn + build + Nio bridge) justifies premium pricing.

---

## Competitive Position

```text
                    UNDERSTANDS CODE
                         ▲
                         │
     Niotebook ──────────┼──────────── Cursor
     (Learn+Build+Nio)   │             (Pro IDE)
                         │
BUILDS WITH AI ◄─────────┼──────────► WRITES CODE MANUALLY
                         │
     Bolt / Lovable      │       freeCodeCamp / Codecademy
     (Pure vibe coding)  │       (Pure education)
                         │
                         ▼
                  DOESN'T UNDERSTAND
```

**Niotebook occupies the top-left quadrant** — the intersection of "builds with AI" and "understands code." No major player sits here today. Replit Learn is the closest but teaches prompting skills, not code comprehension.

---

## Build Order

### Phase 0: Monorepo Scaffolding (Week 0 — FIRST)

> **This is the very first thing to do in the new Claude Code session on niotebook_v0.3.**

1. **Create new repo** — `niotebook_v0.3` on GitHub
2. **Initialize monorepo** — pnpm + Turborepo + TypeScript base config
3. **Import Focus mode** — Copy niotebook_v0.2 source into `apps/focus/` (no .git history)
4. **Import Build mode** — Clone bolt.diy, strip WebContainers, place into `apps/build/`
5. **Create shared packages** — `packages/nio-shared/`, `packages/brand/`, `packages/auth/`
6. **Move Convex to root** — Single `convex/` directory at monorepo root
7. **Create infra directory** — `infra/openhands/`, `infra/e2b-template/`, `infra/cloudflare/`
8. **Wire Turborepo pipelines** — build, lint, typecheck, test per app
9. **Set up CI/CD** — Fresh GitHub Actions workflows
10. **Write new CLAUDE.md** — Monorepo-aware commands and conventions
11. **Verify both apps build independently** — `turbo run build --filter=apps/focus` and `turbo run build --filter=apps/build`
12. **First commit** — `feat: initialize niotebook v0.3 monorepo (LEARN.BUILD.SHARE)`

### Phase A: Build Mode Foundation (Weeks 1-4)

1. **Strip WebContainer from apps/build/** — Remove `@webcontainer/api` and all 5 coupling points:
   - `app/lib/webcontainer/index.ts` → DELETE (replace with Agent Interface)
   - `app/lib/webcontainer/auth.client.ts` → DELETE
   - `app/lib/runtime/action-runner.ts` → REWRITE (~300 LOC, swap WC calls for Agent Interface)
   - `app/lib/stores/files.ts` → MODIFY (~100 LOC, swap WC fs calls)
   - `app/utils/constants.ts` → UPDATE WORK_DIR path
   - `app/lib/common/prompts/prompts.ts` → REWRITE for OpenHands+E2B environment
2. **Implement E2B RuntimeBackend** — Replace WebContainer API surface with E2B SDK:
   - `fs.writeFile/readFile/readdir/mkdir/rm` → `sandbox.filesystem.*`
   - `spawn()` → `sandbox.commands.run()`
   - `server-ready` event → `sandbox.getHost(port)`
   - `fs.watchPaths()` → `sandbox.filesystem.watch()`
3. **Create custom E2B template** — Node.js 22 + Python 3.12 + common dev tools
4. **Verify core loop works** — Prompt → generate code → files appear in editor → dev server starts → preview loads

### Phase B: OpenHands Integration (Weeks 3-6, overlapping)

5. **Deploy OpenHands Agent Server** — Self-hosted (Fly.io / Railway / AWS), connected to E2B via custom workspace bridge
6. **Build E2B Bridge** — Translate OpenHands workspace operations to E2B SDK calls:
   - `execute_command()` → `sandbox.commands.run()`
   - `file_upload/download()` → `sandbox.filesystem.write/read()`
7. **Wire UI to Agent Server** — Replace bolt.diy's ActionRunner with OpenHands Agent Server WebSocket:
   - Chat input → `POST /conversations/{id}/messages`
   - Agent events → streamed via `GET /conversations/{id}/stream` (WebSocket)
   - File changes, terminal output, preview URLs → forwarded to Nanostores
8. **Customize Agent** — Niotebook-specific system prompts, tool selection, security policies

### Phase C: Integration & Polish (Weeks 5-8)

9. **Clerk auth integration** — Shared auth across niotebook.com and build.niotebook.com
10. **Niotebook branding** — Restyle bolt.diy with Niotebook design language (fonts, colors, logos from `@niotebook/brand`)
11. **Deploy pipeline** — One-click deploy user apps to Cloudflare Workers
12. **Nio context bridge** — `@niotebook/nio-shared` types + `convex/nio/` functions connecting Focus ↔ Build learning state
13. **Subdomain deployment** — build.niotebook.com production setup (Vercel or Cloudflare Pages)

### Phase D: Nio Intelligence (Weeks 8-12+)

14. **Embeddings pipeline** — Process all course transcript segments into vector embeddings
15. **RAG retrieval** — Real-time concept lookup from Build mode context
16. **Cross-mode nudges** — "You're building a REST API. Watch this 3-min segment on HTTP methods from CS50."
17. **User learning profile** — Track concept mastery across Focus and Build modes

### Phase E: Monetization (Parallel with D)

18. **Billing infrastructure** — Stripe/Lemon Squeezy subscription management
19. **Usage metering** — Track E2B sandbox hours, agent calls, deploys
20. **Tier gating** — Free (Focus only) vs paid (Build access)

---

## Key Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| E2B pricing at scale | Cost overrun | Monitor per-user costs. E2B SDK is MIT — self-host Firecracker if needed at scale. |
| OpenHands V1 SDK instability | Integration breaks | Pin to specific release. Contribute upstream fixes. Maintain thin abstraction layer. |
| Agent quality (hallucinations, bad code) | Poor UX | Custom system prompts. ConfirmationPolicy for destructive actions. User feedback loop. |
| Two-app UX feels disjointed | User confusion | Shared packages (@niotebook/brand, @niotebook/auth), shared Nio thread, consistent nav. |
| Bolt.diy upstream divergence | Fork maintenance | Cherry-pick valuable upstream changes. Keep fork diff minimal and well-documented. |
| E2B session limits (24hr max) | Power users blocked | Auto-save project state. Resume sessions seamlessly. Lobby E2B for extended limits. |
| Monorepo complexity | Slower CI, tooling friction | Turborepo caching. Scoped commands (`--filter`). Clean package boundaries. |
| v0.2 → v0.3 cutover | User disruption | Run both in parallel. Cutover only when v0.3 Focus mode is verified identical. |

---

## Success Criteria

**Build mode v1 is "done" when:**

- [ ] User can describe an app in natural language
- [ ] OpenHands agent generates a multi-file project
- [ ] Files appear in real-time in the code editor
- [ ] Terminal shows agent's commands executing
- [ ] Live preview renders the running app via E2B preview URL
- [ ] User can iterate via chat ("add dark mode", "fix the bug on line 23")
- [ ] Agent autonomously debugs errors (reads error → reasons → fixes → retests)
- [ ] User can manually edit code alongside agent generation
- [ ] One-click deploy to Cloudflare Workers
- [ ] Nio is aware of what the user studied in Focus mode
- [ ] Authentication shared with niotebook.com via Clerk
- [ ] Niotebook brand identity applied throughout

---

## Transition Instructions: v0.2 Session → v0.3 Session

> **For the new Claude Code session working on niotebook_v0.3:**

### Context to carry forward

1. **Read this plan first** — it is the single source of truth for the LEARN.BUILD.SHARE architecture.
2. **Architecture is Variant C** — Bolt.diy UI + OpenHands Agent + E2B Runtime. No phased compromise. Full integration from day 0.
3. **This is a monorepo** — pnpm workspaces + Turborepo. Two apps (focus + build), three shared packages, one Convex backend.
4. **Start with Phase 0** — Scaffold the monorepo structure before touching any application code.

### What to import from niotebook_v0.2

From the `niotebook_v0.2` repository, copy these into `apps/focus/`:

```text
src/           → apps/focus/src/
public/        → apps/focus/public/
next.config.ts → apps/focus/next.config.ts
postcss.config.mjs → apps/focus/postcss.config.mjs
tailwind related configs → apps/focus/
tsconfig.json  → apps/focus/tsconfig.json (modify to extend ../../tsconfig.base.json)
package.json   → apps/focus/package.json (app-specific deps only, remove turbo/root-level deps)
```

Move to monorepo root:
```text
convex/        → convex/         (root level — shared by both apps)
.env.local     → .env.local      (root level — shared env vars)
```

Do NOT copy:
```text
.git/          (fresh history for v0.3)
node_modules/  (pnpm will install)
.next/         (build artifact)
docs/          (v0.2 docs stay in v0.2 repo, except this plan file)
```

### What to import from bolt.diy

Clone `stackblitz-labs/bolt.diy`, then copy into `apps/build/`:

```text
app/           → apps/build/app/
vite.config.ts → apps/build/vite.config.ts
tsconfig.json  → apps/build/tsconfig.json (modify to extend ../../tsconfig.base.json)
package.json   → apps/build/package.json (keep Remix deps, remove @webcontainer/api)
```

Then strip WebContainer (Phase A step 1) and remove StackBlitz-specific features.

### Accounts and services needed

- **E2B account** — Sign up at e2b.dev, get API key
- **OpenHands** — Clone repo, deploy Agent Server (Docker), get API endpoint
- **Clerk** — Same instance as v0.2 (add build.niotebook.com to allowed origins)
- **Convex** — Same deployment as v0.2 (both apps share it)
- **GitHub** — Create `niotebook_v0.3` repo under Akram012388

### Key conventions for the new repo

- **Package manager:** pnpm (not bun — Turborepo works best with pnpm)
- **Monorepo tool:** Turborepo
- **TypeScript:** Strict mode, shared base config at root
- **Linting:** ESLint 9 flat config (consistent across both apps)
- **Formatting:** Prettier
- **Commits:** Conventional commits (`feat:`, `fix:`, `docs:`, etc.)
- **Branch strategy:** Feature branches off main, never push directly to main

---

## Appendix: Research Sources

This plan is informed by deep research conducted on February 9, 2026:

- 20+ OSS vibe coding projects analyzed
- 4 runtime architectures compared (WebContainers, Cloudflare Workers, Docker, E2B Firecracker)
- Market landscape: $7.37B market, 27% CAGR, 92% developer AI adoption
- Competitor analysis: Cursor ($29.3B), Lovable ($6.6B), Replit ($3-9B), Bolt ($700M)
- The learn-to-build gap validated by Stack Overflow, Boot.dev, academic research, senior engineers
- Bolt.diy codebase: WebContainer coupling isolated to 5 files, ~400 LOC to refactor
- OpenHands SDK: REST + WebSocket API, Docker/E2B-compatible workspace abstraction
- E2B: 150ms startup, built-in preview URLs, $0.05/hr, TypeScript SDK (MIT)

### Key upstream repositories

| Project | Repo | Stars | License |
|---------|------|-------|---------|
| Bolt.diy | `stackblitz-labs/bolt.diy` | ~19k | MIT (source), WebContainer API proprietary |
| OpenHands | `OpenHands/OpenHands` | ~67.6k | MIT |
| E2B | `e2b-dev/E2B` | varies | MIT (SDK) |

### Bolt.diy files that touch WebContainer (surgery targets)

| File | Lines to change | Action |
|------|----------------|--------|
| `app/lib/webcontainer/index.ts` | All | DELETE → replace with Agent Interface |
| `app/lib/webcontainer/auth.client.ts` | All | DELETE |
| `app/lib/runtime/action-runner.ts` | ~300 LOC | REWRITE WebContainer calls |
| `app/lib/stores/files.ts` | ~100 LOC | MODIFY fs calls |
| `app/utils/constants.ts` | 1 line | UPDATE WORK_DIR |
| `app/lib/common/prompts/prompts.ts` | ~50 LOC | REWRITE for Docker/E2B environment |
