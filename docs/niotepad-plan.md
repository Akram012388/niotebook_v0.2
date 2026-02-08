# Niotepad — Feature Plan

> **Branch:** `feat/niotepad`
> **Status:** Planning (no code written)
> **Created:** 2026-02-08

---

## 1. Vision

Niotepad is a **living, context-aware knowledge capture surface** — a fourth pane content type that slots into Niotebook's existing workspace layout system. It is not a mundane AI notebook or a dumb scratch pad. It is a **smart, timestamped learning journal** that captures moments from every pane with one-click push actions, and flows content bidirectionally back into the workspace.

The three existing panes — Video (watch), Code (practice), Chat (discuss) — serve the core thesis. Niotepad extends this with a fourth modality: **capture and reflect**. It makes Niotebook irresistible by turning passive learning into active knowledge construction.

### Design Ethos

- Full notebook aesthetic: warm paper tone, binder rails, hole-punched edges — the same physical-artifact feel as the landing page `NotebookFrame`
- Structural consistency: "N" in the pane toggle switcher, "Niotepad" as pane header title — same patterns as V/C/A
- Smart and savvy: AI-powered background summarization, one-click capture, workspace-aware entries
- Editable always: unlike the immutable chat log, Niotepad entries are living documents you refine

---

## 2. Layout Integration Rules

### 2.1 Single Mode (1-col)

**Niotepad is NOT available in single mode.** The canvas is too large for a notepad and the UX doesn't fit.

> **Deferred idea (experimental):** If single mode is ever added, split the pane into a two-page spread with dual binder lines (left and right) to create a classic open-notebook aesthetic. This is a future exploration, not part of this implementation.

### 2.2 Split Mode (2-col)

- **Left pane:** V / C switcher (unchanged)
- **Right pane:** A / C / **N** switcher (Niotepad added as third option)
- Niotepad replaces Chat or Code in the right slot only
- Video always occupies its dedicated left position when selected
- Constraint: if left = Code, right is forced to Chat (existing rule) — Niotepad is NOT available when left = Code (same constraint as Code on right)

### 2.3 Triple Mode (3-col)

- **Left pane (col 1):** Video — always fixed, no switcher
- **Middle pane (col 2):** C / A / **N** switcher
- **Right pane (col 3):** C / A / **N** switcher
- Both middle and right panes can independently toggle between Code, Chat, and Niotepad
- Constraint: only one Niotepad instance at a time — if middle = Niotepad, right cannot also be Niotepad (and vice versa)
- Constraint: at least one of middle/right must show Code or Chat (prevent both being Niotepad — already handled by single-instance rule)

### 2.4 Keyboard Shortcuts

- `n` key: toggle Niotepad into the applicable pane slot (right pane in split, rightmost non-video pane in triple)
- Existing shortcuts `1`/`2`/`3` for layout, `v`/`c`/`a` for pane content — all unchanged

### 2.5 Edge Case: Language Selector in Triple Mode

The programming language selector slide-out is already tight in triple mode. Adding a third toggle option (N) to the middle and right pane switchers increases the pill bar width.

**Accepted trade-off:** In triple mode, allow the language selector slide-out to overlap the content pane header. This preserves the simple, clean, horizontal slide-out pattern across all three layouts. The overlap is acceptable given the value Niotepad provides and the configurable IDE-like nature of the workspace.

**Implementation note:** Solve this with `z-index` layering — language selector gets a higher z-index than the pane header bar, allowing it to visually float over the header when expanded. This avoids breaking visual harmony with the other layouts.

---

## 3. Data Model

### 3.1 Entry Type

```typescript
type NiotepadEntrySource = "chat" | "code" | "video" | "manual";

type NiotepadEntry = {
  id: string;                    // nanoid
  source: NiotepadEntrySource;
  content: string;               // Markdown — always editable
  createdAt: number;             // Unix ms timestamp
  updatedAt: number;             // Unix ms — tracks edits
  videoTimeSec: number | null;   // Video position at capture time
  lessonId: string;              // Scoped per lesson
  metadata: {
    chatMessageId?: string;      // If pushed from chat
    filePath?: string;           // If pushed from code editor
    language?: string;           // Code language (js, python, etc.)
    transcriptRange?: [number, number]; // [startSec, endSec] if from video
    codeHash?: string;           // Snapshot hash at capture time
  };
};
```

### 3.2 Snapshot Type (for persistence)

```typescript
type NiotepadSnapshot = {
  lessonId: string;
  entries: NiotepadEntry[];
  version: 1;
};
```

### 3.3 Storage

- **Per-lesson scoping:** Each lesson has its own Niotepad entries (same pattern as VFS)
- **IndexedDB persistence:** Database `niotebook-niotepad`, object store `pads`, key = lessonId
- **Auto-save:** 500ms debounce after any mutation (same pattern as VFS)
- **No Convex persistence initially:** Client-side only for speed. Server sync is a future enhancement.
- **Graceful degradation:** All IndexedDB ops wrapped in try/catch, falls back to in-memory only

---

## 4. Niotepad Pane Component

### 4.1 Visual Design

The pane wraps content in a **workspace-adapted binder frame**:

- Binder rails on the left edge (reusing `NotebookFrame` geometry: 2px rails, 2px gap, 6px holes, 12px spacing)
- Adapted for pane context: no outer rounded corners (flush with workspace grid), binder flush to left edge
- Warm paper background tone via `bg-surface` (inherits theme warmth)
- Subtle lined-paper effect: CSS `repeating-linear-gradient` for faint horizontal rules across the content area
- Entries flow top-to-bottom, newest at bottom (chronological journal)

### 4.2 Entry Rendering

Each entry displays:
- **Header line:** Timestamp (e.g., "Feb 8, 2:34 PM") + source badge icon (chat bubble / code brackets / play triangle / pencil for manual)
- **Content body:** Rendered Markdown (same ReactMarkdown pipeline as chat messages)
- **Edit affordance:** Click to enter inline edit mode (textarea replaces rendered markdown)
- **Action buttons (on hover):** Copy, Delete, Push-to-Chat, Insert-to-Editor (contextual based on content type)

### 4.3 Manual Entry Composer

- Small composer bar at the bottom of the pane (same position as ChatComposer in AiPane)
- Markdown-capable textarea with a "Add" button
- Creates entries with `source: "manual"`
- Placeholder text: "Capture a thought..."

### 4.4 Pane Header

- Title: "Niotepad" — consistent with "Video", "Code", "Chat" headers
- Entry count indicator (subtle, non-intrusive)
- Actions: Export as Markdown, Clear all (with confirmation dialog)

---

## 5. Push Mode — Capture Mechanics

### 5.1 Push from Chat (AiPane)

- **AI response push:** Hover on any AI message in chat → small push icon appears in message header → one click saves the full response as a Niotepad entry (`source: "chat"`, `chatMessageId` in metadata)
- **Code block push:** Hover on a code block within a chat message → dedicated push icon on the code block → saves just the code snippet with `language` metadata
- **Selected text push:** Select text in a chat message → floating push tooltip → saves selection

### 5.2 Push from Code (CodePane)

- **Selection push:** Select code in the editor → floating push action appears → saves selected code as Niotepad entry (`source: "code"`, `filePath`, `language` in metadata)
- **File snapshot push:** Button in CodePane header → saves current file content as a full snapshot entry

### 5.3 Push from Video (VideoPane)

- **"Push moment" button** in VideoPane header or info strip → triggers background AI call:
  1. Grabs current transcript window (+-30s around current playback time)
  2. Sends to AI provider with a "summarize concisely in 1-2 sentences" system prompt
  3. On completion, creates Niotepad entry (`source: "video"`, `videoTimeSec`, `transcriptRange` in metadata)
  4. Summary is **short, concise, and precise** — not paragraph-length
- Loading state: subtle spinner on the push button during AI summarization
- Fallback: if AI summarization fails, push raw transcript text with a note

### 5.4 Push Animation

When an entry is pushed from any source:
- Brief slide-in animation from the left edge
- Subtle highlight pulse on the new entry (warm accent glow, fades after 1.5s)
- If Niotepad pane is not currently visible, show a small badge/dot on the "N" toggle pill

---

## 6. Bidirectional Flow — Pull Actions

### 6.1 Niotepad to Chat

- Any entry → "Send to chat" action button → populates the ChatComposer textarea with the entry content
- Does NOT auto-send — user reviews and edits before sending
- If Chat pane is not visible, this switches the applicable pane to Chat first

### 6.2 Niotepad to Code

- Code-type entries → "Insert to editor" action button → inserts content at cursor position in the active editor file
- If Code pane is not visible, this switches the applicable pane to Code first

### 6.3 Niotepad to Video (seek)

- Video-sourced entries with `videoTimeSec` → clicking the timestamp seeks the video player to that moment
- Uses existing `seekRequest` mechanism from WorkspaceGrid

---

## 7. Implementation Phases

### Phase 1: Store & Types (Foundation)

**New files:**
- `src/domain/niotepad.ts` — Pure types (NiotepadEntry, NiotepadSnapshot, NiotepadEntrySource)
- `src/infra/niotepad/useNiotepadStore.ts` — Zustand store (CRUD, ordering, per-lesson scoping)
- `src/infra/niotepad/indexedDbNiotepad.ts` — IndexedDB backend (same pattern as `indexedDbBackend.ts`)

**Commit:** `feat(niotepad): add domain types and Zustand store with IndexedDB persistence`

### Phase 2: Niotepad Pane Component

**New files:**
- `src/ui/panes/NiotepadPane.tsx` — Main pane component with binder frame, entry list, composer
- `src/ui/panes/NiotepadEntry.tsx` — Single entry component (render, edit, actions)

**Commit:** `feat(niotepad): add NiotepadPane with binder frame and entry rendering`

### Phase 3: Layout Integration — Pane Switching

**Modified files:**
- `src/ui/layout/WorkspaceGrid.tsx` — Add "niotepad" to pane state types, extend PaneSwitcher options, add N toggle to right pane (split) and middle+right panes (triple), add `n` keyboard shortcut, enforce single-instance constraint
- `src/ui/layout/layoutTypes.ts` — No changes needed (layout presets unchanged, only pane content types expand)

**Commit:** `feat(niotepad): integrate Niotepad into pane switcher for split and triple layouts`

### Phase 4: Push Mode — Chat & Code

**Modified files:**
- `src/ui/chat/ChatMessage.tsx` — Add push-to-niotepad icon on hover for AI responses and code blocks
- `src/ui/panes/CodePane.tsx` — Add push-selection and push-file actions
- `src/ui/panes/NiotepadPane.tsx` — Handle incoming push entries

**New files (if needed):**
- `src/ui/shared/PushToNiotepad.tsx` — Reusable push button/icon component

**Commit:** `feat(niotepad): add push-to-niotepad from chat messages and code editor`

### Phase 5: Push Mode — Video (AI Summary)

**Modified files:**
- `src/ui/panes/VideoPane.tsx` — Add "push moment" button
- `src/app/api/nio/route.ts` — Add summarization mode (or new lightweight endpoint)
- `src/domain/nioPrompt.ts` — Add transcript summarization prompt

**Commit:** `feat(niotepad): add video moment push with AI transcript summarization`

### Phase 6: Bidirectional Pull Actions

**Modified files:**
- `src/ui/panes/NiotepadEntry.tsx` — Add pull action buttons (send-to-chat, insert-to-editor, seek-video)
- `src/ui/panes/NiotepadPane.tsx` — Wire pull callbacks to WorkspaceGrid

**Commit:** `feat(niotepad): add bidirectional pull actions (to-chat, to-editor, seek-video)`

### Phase 7: Polish & Edge Cases

- Push animation (slide-in + highlight pulse)
- Badge indicator on "N" pill when entries are pushed while Niotepad is hidden
- Export as Markdown download
- Clear all with confirmation
- Language selector overlap fix in triple mode (z-index solution)
- Keyboard shortcut refinement
- Edge case testing across all layout combinations

**Commit:** `feat(niotepad): polish animations, badge indicator, export, and edge cases`

---

## 8. Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| State management | Zustand store | Richer state than pane toggles; entries need CRUD, filtering, per-lesson scoping |
| Persistence | IndexedDB (client-side) | Same proven pattern as VFS; fast, no server round-trips; Convex sync deferred |
| Per-lesson scoping | Yes | Each lesson gets its own Niotepad; switching lessons loads different entries |
| AI summarization | Reuse `/api/nio` route | Avoid new endpoints; add a `mode: "summarize"` flag with a lightweight prompt |
| Single-instance | Enforced | Only one Niotepad visible at a time across all pane slots |
| Entry editability | Always editable | Key differentiator from chat; entries are living documents |
| Single mode | Excluded | Canvas too large; deferred dual-page experiment for future |
| Binder frame | Adapted NotebookFrame | Reuse geometry constants; adapt for pane context (flush edges) |

---

## 9. Files Touched Summary

### New Files (7)
- `docs/niotepad-plan.md` — This plan
- `src/domain/niotepad.ts` — Domain types
- `src/infra/niotepad/useNiotepadStore.ts` — Zustand store
- `src/infra/niotepad/indexedDbNiotepad.ts` — IndexedDB backend
- `src/ui/panes/NiotepadPane.tsx` — Main pane component
- `src/ui/panes/NiotepadEntry.tsx` — Entry component
- `src/ui/shared/PushToNiotepad.tsx` — Reusable push button

### Modified Files (6)
- `src/ui/layout/WorkspaceGrid.tsx` — Pane state types + switcher options + keyboard shortcut
- `src/ui/chat/ChatMessage.tsx` — Push icons on messages/code blocks
- `src/ui/panes/CodePane.tsx` — Push selection/file actions
- `src/ui/panes/VideoPane.tsx` — Push moment button
- `src/app/api/nio/route.ts` — Summarization mode
- `src/domain/nioPrompt.ts` — Summarization prompt

---

## 10. Open Questions (To Resolve During Implementation)

1. **Triple mode dual-switcher constraint:** If middle = Chat and right = Niotepad, then user switches middle to Niotepad — should right auto-switch to Chat, or should we block the middle switch? Proposed: auto-swap (if middle goes to N, right swaps to whatever middle was).
2. **Entry limit per lesson:** Should we cap entries (e.g., 200 per lesson) to prevent IndexedDB bloat? Proposed: soft cap with a "your niotepad is getting full" notice.
3. **Rich editing:** Should entry editing support full Markdown toolbar, or just raw text editing? Proposed: raw textarea with Markdown preview toggle (keep it minimal).
4. **Convex sync (future):** When we add server persistence, should entries sync in real-time across devices? Proposed: yes, but this is a V2 concern.
