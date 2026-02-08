# Niotepad — Feature Plan (Revised)

> **Branch:** `feat/niotepad`
> **Status:** Implementation in progress — Phase 8 (overhaul)
> **Created:** 2026-02-08
> **Revised:** 2026-02-08 — Design intent interview with Akram

---

## 1. Vision

Niotepad is a **living, context-aware knowledge capture surface** — a fourth pane content type that slots into Niotebook's existing workspace layout system. It is not a mundane AI notebook or a dumb scratch pad. It is a **smart, timestamped learning journal** that captures moments from every pane with one-click push actions.

The three existing panes — Video (watch), Code (practice), Chat (discuss) — serve the core thesis. Niotepad extends this with a fourth modality: **capture and reflect**. It makes Niotebook irresistible by turning passive learning into active knowledge construction.

### Design Ethos — Form Follows Function

- **Pure notepad experience:** Every entry looks the same regardless of source — plain text on paper. No source badges, no icons, no cards. Just your notes.
- **Binder aesthetic:** Left-edge binder rails with punch-holes, adapted from NotebookFrame geometry
- **Subtle grid texture:** The writable area uses the same grid pattern as the landing page (`nio-pattern`), but at extremely low opacity — a barely-there texture, NOT the ruled-line paper from Phase 1
- **Smart capture:** AI-powered background summarization for video moments, one-click push from any pane
- **Click to edit, swipe to delete:** Minimal interaction model — no hover actions, no toolbars

---

## 2. Layout Integration Rules

> **Status:** DONE (Phase 3). No changes needed.

### 2.1 Single Mode (1-col)

**Niotepad is NOT available in single mode.**

### 2.2 Split Mode (2-col)

- **Left pane:** V / C switcher (unchanged)
- **Right pane:** A / C / **N** switcher (Niotepad added as third option)
- Constraint: if left = Code, right is forced to Chat — Niotepad is NOT available

### 2.3 Triple Mode (3-col)

- **Left pane (col 1):** Video — always fixed
- **Middle pane (col 2):** C / A / **N** switcher
- **Right pane (col 3):** C / A / **N** switcher
- Single-instance constraint: only one Niotepad at a time (auto-swap on conflict)

### 2.4 Keyboard Shortcuts

- `n` key: toggle Niotepad into the applicable pane slot

---

## 3. Data Model

> **Status:** DONE (Phase 1). No changes needed.

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

### Storage

- **IndexedDB persistence:** Database `niotebook-niotepad`, object store `pads`, key = lessonId
- **Auto-save:** 500ms debounce after any mutation
- **Zustand store:** `useNiotepadStore` — addEntry returns `string` (entry ID) for async updates

---

## 4. Niotepad Pane Component — REVISED DESIGN

### 4.1 Visual Design

The pane wraps content in a **workspace-adapted binder frame**:

- **Binder rails** on the left edge (reusing NotebookFrame geometry: 2px rails, 2px gap, 6px holes, 12px spacing)
- **Grid texture** in the writable area only (not the pane header):
  - Same pattern as the landing page `nio-pattern` class
  - CSS: `linear-gradient(var(--pattern-color) 1px, transparent 1px), linear-gradient(90deg, var(--pattern-color) 1px, transparent 1px)` at `24px 24px` size
  - **Critical:** opacity must be extremely low — override `--pattern-opacity` to ~0.012 for the niotepad context. Barely perceptible.
  - Use `background-attachment: local` so the grid scrolls with content (text sits on grid rows)
- Entries flow top-to-bottom, newest at bottom (chronological journal)
- **NO ruled-line paper** — the horizontal-only `repeating-linear-gradient` is removed

### 4.2 Entry Rendering — SIMPLIFIED

**Every entry is pure plain text.** No source indicators, no badges, no icons, no cards, no borders.

- **Manual entries:** Plain text, rendered with ReactMarkdown
- **Code entries:** Content includes markdown code fences — renders as code block
- **Video entries:**
  - **Header line:** `Lecture Title — MM:SS` as a clickable text link (seeks video on click)
  - **Body:** AI summary text below the header
  - The timestamp link is persistent (always visible), not a hover action
  - Format: lecture number + topic from VideoPane's `headerTitle`, plus formatted timestamp
- **Chat entries:** Plain text (user-selected text pushed from chat)

**Entry separation:** Extra line spacing between entries (paragraph-style gaps). No horizontal dividers, no cards, no borders.

### 4.3 Entry Interaction — SIMPLIFIED

- **Click to edit inline:** Click on any entry text → textarea replaces rendered content. Enter = save, Esc = cancel, Blur = save.
- **Swipe to delete:** Touch swipe-left gesture (or horizontal drag on desktop) reveals a delete action. This is the ONLY way to delete individual entries.
- **No hover actions at all.** No copy, no send-to-chat, no insert-to-editor buttons on hover. Pure notepad.
- **Clear all:** Button in the pane header — confirms with dialog. This is the bulk-delete mechanism.

### 4.4 Composer — Click-to-Write

- **No bottom composer bar.** The paper itself IS the writing surface.
- Always-visible textarea at the bottom of entries, flush with the paper
- Click anywhere on empty paper → focus jumps to the textarea
- Enter = submit entry, Shift+Enter = newline
- Placeholder: "Click anywhere to start writing..." (only when zero entries)

### 4.5 Pane Header

- Title: "Niotepad"
- Entry count indicator (subtle, parenthetical)
- Actions: Export as Markdown, Clear all

---

## 5. Push Mode — Capture Mechanics

### 5.1 Push from Code (CodePane)

> **Status:** DONE. Button in header, wraps content in markdown code fences.

### 5.2 Push from Video (VideoPane) — AI Summarization

> **Status:** DONE (async flow). Entry rendering needs fixing.

**Flow:**
1. User clicks pin icon in VideoPane header
2. Entry created immediately with `content: "Summarizing..."` placeholder + `videoTimeSec`
3. Async `POST /api/nio/summarize` called with `{ lessonId, timeSec }`
4. Fetches +-15s transcript window → sends to Gemini Flash → returns 1-2 sentence summary
5. Entry updated with AI summary text
6. Fallback: "Video moment at MM:SS" if AI fails

**What needs fixing:**
- The entry must render with the `Lecture Title — MM:SS` header format (clickable, seeks video)
- AI summaries currently truncate after 2-3 words — the entry content rendering is broken
- The timestamp should NOT be a styled button — it should be plain text link (underline on hover)

### 5.3 Push from Chat (AiPane) — NOT YET BUILT

**Interaction model:** User selects text in a chat message → floating push tooltip appears → only the selection gets pushed to niotepad.

**Implementation:**
- Listen for `selectionchange` events within the chat message area
- When selection exists within a chat message, show a small floating "Push to Niotepad" tooltip near the selection
- On click, create entry with `source: "chat"`, `content: selectedText`, `chatMessageId` in metadata
- No full-message push — only user-selected text

### 5.4 Push Animation (DEFERRED)

- Brief slide-in animation from the left edge
- Subtle highlight pulse on the new entry (warm accent glow, fades after 1.5s)
- Badge/dot on "N" pill when entries pushed while Niotepad is hidden

---

## 6. Pull Actions — SIMPLIFIED

Given the "no hover actions" design decision, pull actions are reduced to:

### 6.1 Video Seek (via timestamp link)

- Video entries display `Lecture Title — MM:SS` as a clickable text link
- Clicking seeks the video player via the existing `seekRequest` mechanism
- This is the ONLY pull action that remains in the pure notepad model

### 6.2 Send-to-Chat and Insert-to-Editor — DEFERRED

These required hover action buttons which are now removed. They may be revisited via:
- Context menu (right-click on entry)
- Keyboard shortcuts while entry is focused
- A future command palette

---

## 7. Implementation Phases — REVISED

### Phases 1-5: DONE (committed)

- Phase 1: Domain types + Zustand store + IndexedDB persistence
- Phase 2: NiotepadPane with binder frame + NiotepadEntry
- Phase 3: WorkspaceGrid integration, pane switcher, keyboard shortcut
- Phase 4: Push-to-niotepad from CodePane (code fencing) + ChatMessage push icon
- Phase 5: Video moment push with async AI summarization

### Phase 8: Overhaul (THIS PHASE — current work)

All work on sub-branches off `feat/niotepad`. PRs merge to `feat/niotepad`, NOT to `main`.

#### 8A: NiotepadEntry overhaul (`niotepad/entry-overhaul`)

**Files:** `src/ui/panes/NiotepadEntry.tsx`

- Remove source icon badges (SOURCE_ICONS, header line with emoji)
- Remove ALL hover action buttons (Copy, Chat, Insert, Del)
- Remove the hover action bar container entirely
- For video entries: render `Lecture Title — MM:SS` as a clickable `<button>` styled as plain text link (underline on hover), with the AI summary below
- For all other entries: render content directly via ReactMarkdown, no header line
- Entry separation: use margin-bottom for paragraph-style spacing between entries
- Swipe-to-delete: implement horizontal swipe gesture (touch + mouse drag) that reveals a red delete strip
- Click-to-edit: keep the existing inline edit behavior (textarea on click)
- Fix content rendering: ensure ReactMarkdown renders full AI summaries (debug truncation issue)

#### 8B: NiotepadPane visual overhaul (`niotepad/pane-visual`)

**Files:** `src/ui/panes/NiotepadPane.tsx`, `src/app/globals.css` (if needed)

- Replace `linedPaperBg` (horizontal ruled lines) with grid pattern:
  - Use the same CSS as `.nio-pattern::before` but as a `background-image` on the scrollable area
  - `background-attachment: local` so grid scrolls with content
  - Override `--pattern-opacity` to extremely low value (~0.012) for the niotepad context
  - Grid only applies to the writable/scrollable area, NOT the pane header
- Keep binder rails exactly as they are
- Keep click-to-write behavior (handlePaperClick → focus textarea)
- Keep Export and Clear All buttons in header

#### 8C: Chat push — text selection (`niotepad/chat-push`)

**Files:** `src/ui/chat/ChatMessage.tsx` (or parent chat container)

- Implement text selection detection within chat messages
- On valid selection: show small floating tooltip "Push to N" near the selection
- On tooltip click: push selected text as niotepad entry with `source: "chat"`
- Tooltip disappears when selection is cleared
- Use `document.addEventListener('selectionchange')` scoped to the chat area

#### 8D: Video entry format — lecture title + timestamp (`niotepad/video-entry-format`)

**Files:** `src/ui/panes/NiotepadEntry.tsx`, `src/ui/panes/NiotepadPane.tsx`, possibly `src/ui/panes/VideoPane.tsx`

- Video entries need access to the lesson/course title to display `Lecture Title — MM:SS`
- Options:
  1. Store the lecture title in entry metadata at push time (in VideoPane's `handlePushMoment`)
  2. Pass it as a prop through NiotepadPane
- Preferred: store `lectureTitle` in entry metadata at creation time — self-contained, works offline
- NiotepadEntry renders: `<button onClick={seekToTime}>Lecture 3: Algorithms — 14:22</button>` styled as text link
- Below the header: AI summary or fallback text

---

## 8. Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| State management | Zustand store | Richer state than pane toggles; entries need CRUD, per-lesson scoping |
| Persistence | IndexedDB (client-side) | Same proven pattern as VFS; Convex sync deferred |
| AI summarization | Dedicated `/api/nio/summarize` endpoint | Clean separation from chat API |
| Entry appearance | Pure plain text, no source indicators | Pure notepad feel — form follows function |
| Hover actions | Removed entirely | Notepad metaphor — you write, read, scroll |
| Delete mechanism | Swipe gesture + clear all | Touch-first, minimal UI |
| Grid pattern | `nio-pattern` adapted with `background-attachment: local` | Scrolls with content, consistent with app identity |
| Chat push | Text selection only | User controls exactly what gets captured |
| Video entry format | `Lecture Title — MM:SS` stored in metadata | Self-contained entries that work offline |
| Pull actions | Only video seek via timestamp link | Others deferred pending UX rethink without hover buttons |

---

## 9. Files Touched Summary (Phase 8)

### Modified Files
- `src/ui/panes/NiotepadEntry.tsx` — Complete overhaul: remove badges, remove hover actions, add swipe-to-delete, fix video entry format, fix content rendering
- `src/ui/panes/NiotepadPane.tsx` — Replace ruled lines with grid pattern, adjust entry spacing
- `src/ui/panes/VideoPane.tsx` — Store lecture title in entry metadata at push time
- `src/ui/chat/ChatMessage.tsx` — Add text selection push-to-niotepad
- `src/app/globals.css` — Optional: niotepad-specific pattern opacity override

### No New Files
All changes are modifications to existing files. No new components needed.

---

## 10. Open Questions — RESOLVED

1. **Triple mode dual-switcher constraint:** RESOLVED — auto-swap (implemented in Phase 3)
2. **Entry limit per lesson:** DEFERRED — not a concern for now
3. **Rich editing:** RESOLVED — raw textarea with markdown rendering (no toolbar)
4. **Hover actions vs clean notepad:** RESOLVED — no hover actions. Pure notepad.
5. **Chat push model:** RESOLVED — text selection only, not full message push
6. **Pull actions without hover buttons:** RESOLVED — only video seek via timestamp link. Others deferred.
7. **Entry visual separation:** RESOLVED — extra line spacing (margin), no dividers
8. **Grid vs ruled lines:** RESOLVED — subtle grid pattern (nio-pattern adapted), not ruled lines
