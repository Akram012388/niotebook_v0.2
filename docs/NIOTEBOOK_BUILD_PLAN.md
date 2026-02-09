# Niotebook Build: Architecture & Roadmap

> **Status:** Approved by Founder (Akram) — February 9, 2026
> **Branch:** `feat/niotebook-build`
> **Decision:** Full Variant C from Day 0 — no phased compromise

---

## Vision

**From:** watch.code.learn (IDE workspace for learners)
**To:** LEARN.BUILD.SHARE (holistic platform bridging understanding and building)

Niotebook Build is the **BUILD layer** — a full-stack vibe coding environment powered by an autonomous AI agent, running inside hardware-isolated sandboxes. It is the hook that sits between LEARN (Focus mode) and SHARE (future iOS/macOS apps). If Build is extraordinary, the flywheel spins. If Build is mediocre, everything collapses.

---

## Architecture: Variant C (Maximum Power)

```
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
│  │          API Gateway (Next.js or Remix BFF)       │   │
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

**Note:** Bolt.diy uses Remix + UnoCSS + Nanostores (not Next.js + Tailwind + Zustand). This is acceptable for the subdomain architecture — Build mode has a "different personality, same brand" per founder direction.

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

### Integration Layer: Niotebook Shared Services

| Service | How Build Mode Connects |
|---------|------------------------|
| **Clerk Auth** | Shared authentication across niotebook.com and build.niotebook.com |
| **Convex** | Nio Intelligence state: user learning history, course progress, concept mastery |
| **Nio Intelligence** | API bridge: Build mode queries Nio for learning context, Nio queries Build mode for project context |
| **Billing** | Subscription management for Build mode access (Stripe or Lemon Squeezy) |

---

## Data Flow: User Prompt → Running App

```
1. User types: "Build me a todo app with drag-and-drop"
                    │
                    ▼
2. UI Layer: Chat component captures input
   → Sends to API Gateway via WebSocket
                    │
                    ▼
3. API Gateway: Authenticates (Clerk), enriches with Nio context
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

```
niotebook.com                    build.niotebook.com
┌────────────────────┐           ┌────────────────────┐
│  Focus Mode        │           │  Build Mode         │
│  (existing app)    │  ◄─────►  │  (bolt.diy fork)   │
│                    │  shared   │                     │
│  Next.js 16        │  Clerk    │  Remix + Vite       │
│  Tailwind CSS 4    │  auth     │  UnoCSS + SCSS      │
│  Zustand + Convex  │    +      │  Nanostores         │
│  Watch.Code.Learn  │  Nio API  │  Prompt.Build.Ship  │
│                    │    +      │                     │
│                    │  Brand    │                     │
└────────────────────┘           └────────────────────┘
        │                                │
        │         Shared Services        │
        │    ┌──────────────────────┐    │
        └────│  Clerk (auth)        │────┘
             │  Convex (Nio state)  │
             │  Stripe (billing)    │
             └──────────────────────┘
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

## Build Order

### Phase A: Foundation (Weeks 1-4)

1. **Fork bolt.diy** → `niotebook-build` repo or monorepo workspace
2. **Strip WebContainer** — Remove `@webcontainer/api` and all 5 coupling points
3. **Implement E2B RuntimeBackend** — Replace WebContainer API surface with E2B SDK
   - `fs.writeFile/readFile/readdir/mkdir/rm` → `sandbox.filesystem.*`
   - `spawn()` → `sandbox.commands.run()`
   - `server-ready` event → `sandbox.getHost(port)`
   - `fs.watchPaths()` → `sandbox.filesystem.watch()`
4. **Verify core loop works** — Prompt → generate code → files appear in editor → dev server starts → preview loads

### Phase B: OpenHands Integration (Weeks 3-6, overlapping)

5. **Deploy OpenHands Agent Server** — Self-hosted, connected to E2B via custom workspace bridge
6. **Build E2B Bridge** — Translate OpenHands workspace operations to E2B SDK calls
   - `execute_command()` → `sandbox.commands.run()`
   - `file_upload/download()` → `sandbox.filesystem.write/read()`
7. **Wire UI to Agent Server** — Replace bolt.diy's ActionRunner with OpenHands Agent Server WebSocket
   - Chat input → `POST /conversations/{id}/messages`
   - Agent events → streamed via `GET /conversations/{id}/stream`
   - File changes, terminal output, preview URLs → forwarded to Nanostores
8. **Customize Agent** — Niotebook-specific system prompts, tool selection, security policies

### Phase C: Integration & Polish (Weeks 5-8)

9. **Clerk auth integration** — Shared auth between niotebook.com and build.niotebook.com
10. **Niotebook branding** — Restyle bolt.diy with Niotebook design language, fonts, colors
11. **Deploy pipeline** — One-click deploy user apps to Cloudflare Workers
12. **Nio context bridge** — API connecting Build mode ↔ Focus mode learning state via Convex
13. **Subdomain deployment** — build.niotebook.com production setup

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
| Two-app UX feels disjointed | User confusion | Shared brand, shared auth, Nio as persistent thread, consistent nav pattern. |
| Bolt.diy upstream divergence | Fork maintenance | Cherry-pick valuable upstream changes. Keep fork diff minimal and well-documented. |
| E2B session limits (24hr max) | Power users blocked | Auto-save project state. Resume sessions seamlessly. Lobby E2B for extended limits. |

---

## Competitive Position

```
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

## Open Questions (To Resolve During Build)

1. **Monorepo vs separate repo?** — Does the bolt.diy fork live in the niotebook_v0.2 monorepo or a separate repo?
2. **OpenHands hosting** — Self-hosted on which cloud? Fly.io? Railway? AWS?
3. **E2B template** — What pre-installed tools/frameworks go into the custom sandbox template?
4. **Nio bridge API design** — Exact shape of the Focus ↔ Build context API
5. **Agent model selection** — Which LLM(s) for the OpenHands agent? Claude Opus? Sonnet? Multi-model routing?

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
