# UI Reference Contract (Mobbin-first)
Status: DRAFT (upgrade to FROZEN when Phase‑1 UI scope is locked)

This document defines the **UI/UX reference baseline** for Niotebook v0.2.
It is a **visual + interaction contract** to keep implementation consistent with:
- docs/PRD.md
- docs/specs.md
- docs/plan.md (Phase‑1 UI scaffolding milestone)
- docs/guidelines.md (KISS, FP boundaries, minimal chrome)

This doc is intentionally **Mobbin-first** to avoid “design-by-imagination” drift.

---

## 0) Non-negotiables (Niotebook constraints)
These override any reference UI if there’s a conflict.

1) Light-first UI
- Default theme: **light**
- Theme toggle: **always visible** in the primary nav

2) KISS surfaces
- No resizable panes.
- Only **3 fixed layout presets**:
  - **1-col**: 100%
  - **2-col**: 60/40
  - **3-col**: 40/30/30
- Premium feel without bloat: minimal elements, no heavy side panels unless necessary.

3) Core triad (Lesson workspace)
- Video pane: player only (no transcript UI in client)
- Code pane: notepad-style editor + terminal output + run/stop
- AI pane: ChatGPT-grade polish and behavior (minimalist, fast, no clutter)

4) The “Sync primitive” must be visible through behavior, not UI clutter
- Chat is continuously synced to lesson/time; messages show subtle `Lesson • mm:ss` badge.
- Clicking a badge seeks video smoothly.
- Code sync only when code exists (and/or on run / snapshot trigger).

---

## 1) Mobbin usage rules
Mobbin is the **reference library**, not an asset pipeline.

- Do **not** commit Mobbin screenshots to the repo (copyright + churn).
- Store **links only** and describe what is being mirrored.
- When implementing any UI element, attach at least **one Mobbin reference link**.

Entry point (Web / Latest):
- https://mobbin.com/discover/apps/web/latest

---

## 2) Canonical reference set (Phase‑1 relevant)
This is the minimum reference pack required to implement the Phase‑1 UI shell.

### 2.1 Global shell + navigation (minimalist)
- OpenAI Web Landing Page (clean top nav + primary input affordance)
  https://mobbin.com/explore/screens/a32a980b-d48a-4f76-8031-3bd156410bfd

**Niotebook mapping**
- Top nav contains (left→right):
  - NioNotebook mark (text logo, minimal)
  - Course / lesson selector (compact)
  - Layout preset toggle (1/2/3)
  - Theme toggle (always visible)
  - User menu (minimal)

### 2.2 Chat pane (must feel like ChatGPT)
Primary references:
- OpenAI Web ChatGPT Interface (sidebar + composer baseline)
  https://mobbin.com/explore/screens/5971e430-041c-4358-bd94-f7e3034616cd
- OpenAI Web ChatGPT Chat Interface
  https://mobbin.com/explore/screens/489498b0-52e8-4581-bc02-084de00d36b4
- OpenAI Web Empty State Screen (empty state tone + chips)
  https://mobbin.com/explore/screens/ced0e571-0d06-4143-86ec-6d50c18e8060
- OpenAI Web Archived Chats (list density + hierarchy)
  https://mobbin.com/explore/screens/fa78b1cf-fa33-4bb1-b8a8-989cfaf41e28

**Niotebook chat UX contract (explicit)**
- Composer:
  - Single multiline textarea that grows up to a max height, then scrolls.
  - `Enter` sends; `Shift+Enter` inserts newline.
  - Send button is a **circular icon button** aligned to the right of the composer.
- Scroll behavior:
  - When user scrolls up, show a **“scroll to bottom”** affordance.
  - Streaming messages do not cause layout jumps; autoscroll only if user is at bottom.
- Message metadata:
  - Each user/assistant message includes a subtle badge:
    - `Lesson • mm:ss` (or `Lesson • hh:mm:ss` for long)
  - Clicking badge seeks the video smoothly.
- Strict TA tone:
  - No off-topic chatting UX affordances (no “fun modes” / stickers / etc).
  - Keep the UI professional and learning-focused.

### 2.3 Theme selection UX (simple, non-invasive)
Reference:
- OpenAI Web Settings Modal (theme selection pattern via modal + switches)
  https://mobbin.com/explore/screens/107d9e2f-f550-4e73-b573-d5a84b03ef92

**Niotebook mapping**
- Theme toggle is always visible in nav.
- A settings modal may exist, but theme must be one-click accessible (toggle).

### 2.4 Code pane (editor + terminal output; minimal)
References:
- GitHub Web Code editor (editor + terminal window relationship)
  https://mobbin.com/explore/screens/513802e0-b43d-4803-a1ad-a056a6ac2264
- OpenAI Web CSS HTML Split (split editor concept for HTML/CSS mode)
  https://mobbin.com/explore/screens/1b6cfd4b-a047-4af3-8361-ad4d2dbd9116
- Retool Web SQL Query Editor (editor toolbar density + “run” affordance style)
  https://mobbin.com/explore/screens/68441054-0ffc-4831-ad77-9879d8aa7c74
- Databricks Web Code Editor Populated (editor readability / gutters)
  https://mobbin.com/explore/screens/765bb960-4da4-4519-8c2f-802a7096901b

**Niotebook code pane UX contract**
- Language selector: compact dropdown (C / Python / JS / TS / HTML / CSS).
- Controls:
  - Run
  - Stop
  - Clear output
  - (Optional) Reset snippet (per lesson) — defer if not in plan.md
- Terminal output:
  - Monospace
  - Shows stdout/stderr clearly
  - Must not feel like a “log dump”; keep spacing readable.

### 2.5 Video pane (player-first; no transcript UI)
References:
- OpenAI Web Video Player Screen (minimal player chrome)
  https://mobbin.com/explore/screens/cd01fea1-79fd-4c5c-b435-85d70e234141
- YouTube Music Web Video Player Screen (player + secondary drawer pattern)
  https://mobbin.com/explore/screens/94005a70-560c-451f-97a8-15f94fc89ecc
- YouTube Web Video Transcript (NEGATIVE reference: do NOT show transcript UI in v0.2 client)
  https://mobbin.com/explore/screens/7f90b4fe-628c-4248-8ed6-a34eb4df3031

**Niotebook mapping**
- Video pane contains:
  - Embedded YouTube player (or wrapper) with minimal surrounding UI.
  - No transcript visible.
  - Seek events must be smooth when driven by chat badge clicks.

### 2.6 Course/Lesson selection (keep it simple)
References:
- OpenAI Web GPT Store Search (search + recent items behavior)
  https://mobbin.com/explore/screens/dc0fa04f-2827-4db0-98b5-5972d9670ff9
- YouTube Web Watch Later Playlist (dense list hierarchy pattern)
  https://mobbin.com/explore/screens/6be3d5fd-1760-47d3-b893-83a7eb48ee0b

**Niotebook mapping**
- Course picker is minimal:
  - list of supported courses (CS50x 2026, CS50P, CS50W, CS50 AI 2023)
  - within a course, show lessons as a simple list
- Avoid “LMS dashboard” complexity.

---

## 3) Implementation rules for Codex/agents (to prevent UI drift)
When implementing Phase‑1 UI scaffolding:

1) Every UI PR must include:
- Which layout preset(s) it touches (1/2/3-col)
- Which pane(s) it changes (video/code/ai)
- Which Mobbin reference link(s) it follows (at least 1)
- A “no extra UI” statement: what was explicitly deferred

2) No “invented design systems”
- Use Tailwind + existing component primitives only.
- If a component must be added, keep it local, minimal, and directly justified.

3) Animation/motion
- Keep transitions subtle.
- Respect reduced motion preferences.
- No flashy effects.

---

## 4) Phase‑1 UI acceptance checklist (practical)
A Phase‑1 UI scaffold is acceptable when:

- Layout presets render correctly and persist.
- Theme toggle is always visible; default is light.
- Chat pane feels ChatGPT-grade:
  - growing textarea
  - enter-to-send
  - autoscroll affordance
  - no layout jump on streaming
- Code pane can run/stop and shows terminal output clearly.
- Video pane is player-first; chat badge click seeks smoothly.
- No transcript UI is visible in the client.

---

## 5) Notes (future)
- If Mobbin links become paywalled or unstable, replace with new Mobbin screen links (do not paste images into repo).
- If we later need Figma, it should be used as a *secondary* artifact. Mobbin remains the baseline for web UI patterns in v0.2.

