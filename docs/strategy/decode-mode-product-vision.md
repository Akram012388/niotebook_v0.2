# Decode Mode: Product Vision

**Date:** 2026-02-09
**Author:** Visionary (Steve Jobs framework)
**Classification:** Board Confidential
**Status:** Approved concept — pending implementation spec

---

## Executive Summary

Niotebook introduces a global workspace mode switch: **Courses | Decode**

- **Courses** (existing) — structured learning. Video lectures + code editor + AI tutor. Follow a professor. Build skills sequentially.
- **Decode** (new) — bring your own code. Nio maps the computational concepts inside it. No curriculum. No video by default. Freedom.

The switch is not a feature. It is the product becoming two products that share one workspace. Together, they make niotebook the only place on earth where "watch. code. learn." serves EVERY kind of learner — from the CS50 student following David Malan to the vibe coder who built an app with Claude and wants to understand what's inside it.

---

## 1. The Essence

One sentence:

> **Decode mode inverts the workspace so your code is the lecture and Nio is the professor who explains the thinking inside it.**

In Courses mode, the video drives the experience and you code along. In Decode mode, YOUR CODE drives the experience and Nio teaches from it. Same three ingredients — Video, Code, AI — but the center of gravity flips.

---

## 2. The Metaphor

**X-ray vision for your code.**

A vibe coder looks at their AI-generated project and sees surface: characters on a screen that happen to work. Decode mode is the moment they put on the glasses and see the skeleton underneath. They see the CONCEPTS. They see the THINKING. They see WHY the AI structured things the way it did.

Before Decode: "I asked Claude to build me a todo app and it works."
After Decode: "I understand that my app uses state management through React hooks, event-driven architecture for user interactions, and conditional rendering for the UI logic — and I know what each of those phrases means because Nio walked me through them in the context of MY code."

---

## 3. The Interface

### The Mode Switch

In the top navigation, left of the layout presets, two words inside a capsule:

**Courses | Decode**

A segmented control with a sliding indicator — exactly like iOS, but with only two segments. The active segment has the accent color fill. The inactive segment is muted text. The indicator slides with a spring animation — not a mechanical click, a fluid slide with weight, like a ball bearing rolling.

### The Transition

When you tap "Decode," three things happen simultaneously in ~300ms:

1. **The workspace breathes.** The video pane exhales — contracts and slides away. The code pane inhales — expands to become the hero. Not a hard cut. A choreographed transition where every element knows where it is going.

2. **The emotional register shifts.** Nio's header changes from "Assistant" to "Decode." Its greeting changes: "Paste your project or start writing. I will map the computational concepts in your code."

3. **The layout presets update.** In Courses mode: Video+Code+AI arrangements (1/2/3-col). In Decode mode: Code-only, or Code+Nio side by side. The video pane is not first-class in Decode — it appears as a floating overlay when curated content is relevant.

**Key principle:** Switching modes must feel like the workspace is REORGANIZING AROUND YOUR INTENT. Not like a different screen loaded. One living workspace that transforms.

---

## 4. The Experience

### The User Journey

You are a vibe coder. You built a full-stack app with Claude last weekend. It works. It's deployed. But you have that gnawing feeling: you don't actually understand any of it. You open niotebook.

You tap **Decode**.

The workspace transforms. Code editor fills the left two-thirds. Nio sits ready on the right. No video. No lecture. Just a clean editor and your AI companion.

You paste your `app.tsx`. Nio responds in seconds:

> "I see five computational concepts at work in your code:
> 1. **State management** — your useState hooks on lines 12, 18, 23
> 2. **Asynchronous data flow** — your fetch call with async/await on line 31
> 3. **Conditional rendering** — ternary expressions on lines 45, 52
> 4. **Event-driven architecture** — onClick and onChange handlers throughout
> 5. **Component composition** — your App breaks into three child components
>
> Which concept do you want to decode first?"

You tap "Asynchronous data flow." Nio doesn't dump a Wikipedia article. Nio says:

> "Look at line 31. When your code says `await fetch(...)`, what do you think happens to the rest of your program while it waits for the server to respond?"

Socratic. Targeted. In the context of YOUR code on YOUR screen. Not a generic lesson. A conversation about YOUR creation.

### Future: Curated Content Layer

When Nio identifies "asynchronous data flow," it surfaces a 3-minute clip from the exact moment in CS50 where David Malan explains promises and async. The clip appears in a minimal floating video card — not a full pane. You watch it, and Nio connects it back: "Now look at your line 31 again. Malan just explained the event loop. Your fetch call uses exactly that mechanism."

The world's best professor explaining a concept, connected to YOUR code. That is the product no one else has built.

### Pane Configuration

| Pane | Role in Decode | Default Visibility |
|------|---------------|-------------------|
| **Code** | PRIMARY — hero pane, user's code | Always visible, dominant width |
| **Nio** | PRIMARY — thinking coach, concept mapper | Always visible, right side |
| **Video** | SECONDARY — curated clips when relevant | Hidden by default, floating overlay when summoned |

### How Nio Behaves Differently

**In Courses mode** (current): Strict TA. Only helps with active course content. Refuses off-topic requests. Context from lesson, video timestamp, transcript.

**In Decode mode** (new):
- Scope is the user's code and the computational concepts within it — not a specific lecture
- Primary job: CONCEPT IDENTIFICATION and CONCEPT EXPLANATION
- Still Socratic — asks questions, doesn't hand answers
- Does NOT generate or refactor code — helps user UNDERSTAND existing code
- Speaks in concepts and patterns, not line-by-line commentary
- Personality: slightly warmer, more collaborative — less "strict TA," more "brilliant friend who happens to be a CS professor"

### Architecture Notes

The implementation is clean against the existing codebase:

- `LayoutPresetContext.tsx` — manages workspace config via `useSyncExternalStore` with localStorage. The mode switch follows the identical pattern: a `WorkspaceModeContext` storing "courses" or "decode" that gates pane config, Nio prompt, and layout presets.
- `WorkspaceGrid.tsx` — already switches rendering based on preset. Adding a mode dimension above the preset is a natural extension.
- `nioPrompt.ts` — becomes mode-aware. Decode gets its own system prompt focused on concept mapping.
- `nioContextBuilder.ts` — gets a Decode-specific path that maximizes code context and replaces lecture context with concept-mapping instructions.
- `VideoPane`, `CodePane`, `AiPane` — already accept header extras and dynamic configuration.

We are not building a second product. We are teaching the same workspace to see the world from a different angle.

---

## 5. The Name

### **Decode**

Four reasons this name is inevitable:

1. **It contains "code."** The entire product is about code. You came with code. You leave having decoded it.

2. **It is a verb.** Verbs have energy. "Decode" implies action, agency, transformation.

3. **It is self-explanatory.** A vibe coder sees "Decode" and immediately understands the promise: "I will understand what I built." Zero explanation needed.

4. **It pairs perfectly with "Courses."** Two modes, a complete learning spectrum:
   - **Courses**: Follow a structured path. Learn from professors.
   - **Decode**: Bring your own creation. Understand what's inside it.

The tagline doesn't change. It's still "watch. code. learn." Because Decode IS learning — a different door into the same house.

---

## 6. The One Magical Thing

Every great product has ONE moment that makes people say "holy shit."

**For Decode: You paste your code. Nio reads it. In three seconds, it draws you a concept map of the computational thinking inside your project.**

Not a line-by-line explanation. Not a code review. A CONCEPT MAP. "Your project uses five ideas: here they are, here is where each one lives in your code, and here is how they connect to each other."

This is the moment the user goes from fog to clarity. From "it works and I don't know why" to "I see the architecture of what I built." The X-ray glasses going on. The moment of sight.

Nobody else does this. ChatGPT explains code sequentially. Copilot suggests code. Codecademy teaches generic concepts. Nobody takes YOUR specific AI-generated project, identifies the computational concepts, and maps them so you understand the thinking underneath.

---

## 7. The Anti-Features

What Decode mode will NEVER do:

| Anti-Feature | Why |
|---|---|
| **Generate code** | Every other AI tool races to write more code. We illuminate existing code. The world needs a code illuminator, not another generator. |
| **Auto-fix or auto-refactor** | When Nio finds an issue, it asks a question, not patches silently. Understanding, not dependence. |
| **Create content** | We curate the best explanations from the best professors on earth. Artists steal. |
| **Gamify** | No points, streaks, badges, leaderboards. Understanding is its own reward. We refuse to cheapen genuine comprehension with engagement farming. |
| **Line-by-line code review** | Decode operates at the CONCEPT level. Variable naming and indentation are for GitHub PRs. We teach thinking. |
| **Have a curriculum** | No "Lesson 1: Variables." Bring whatever code you have. Courses has structure. Decode has freedom. |
| **Require an account to try** | First taste must be instant. Paste code, see the concept map, feel the clarity. Then sign up. |

---

## 8. Implementation Plan (v1)

### What to Ship

| Component | Work Required | Estimate |
|---|---|---|
| `WorkspaceModeContext` — "courses" / "decode" state with localStorage persistence | New context provider, same pattern as `LayoutPresetContext` | 1-2 days |
| Mode switch UI — segmented control in TopNav | New component, spring animation | 2-3 days |
| `WorkspaceGrid` — mode-aware pane rendering | Extend existing grid to gate on mode | 1-2 days |
| Decode Nio system prompt | New prompt in `nioPrompt.ts` focused on concept mapping | 1-2 days |
| Decode context builder path | New branch in `nioContextBuilder.ts` — maximize code, drop lecture context | 2-3 days |
| Decode layout presets | Code-only and Code+Nio presets for Decode mode | 1 day |
| Pane transition animation | Choreographed 300ms transition between modes | 2-3 days |

**Total v1 estimate: 2-3 weeks**

### What to Ship Later

- Floating video overlay (curated clips surfaced by concept)
- Concept map visualization (visual graph of identified concepts)
- Multi-file project support in Decode
- "Comprehension Arc" — Nio tracks concept mastery across sessions

---

## 9. The Positioning Fork

```
niotebook
├── Courses — "watch. code. learn."
│   └── Structured learning from open courseware
│   └── Video + Code + AI in 1/2/3-col layouts
│   └── Follow professors: CS50, MIT OCW, Stanford
│
└── Decode — "understand what you built."
    └── Bring your own code
    └── Nio maps computational concepts
    └── No curriculum, no video by default
    └── The arena for vibe coders who want to level up
```

Two doors. One house. Every learner finds their way in.

---

*"Simplicity is the ultimate sophistication."* — Leonardo da Vinci

*"People don't know what they want until you show it to them."* — Steve Jobs

*This is what we're showing them.*
