# Flagship Demo: Workspace Interface

The primary product demo video for niotebook alpha launch.

## Overview

A 30-second seamless loop showcasing the multi-pane workspace interface and its fluid layout switching. Demonstrates the core value: learn to code alongside video with AI assistance.

## Video Specs

- **Duration:** 30 seconds (seamless loop)
- **Aspect ratio:** 16:9 (1920x1080)
- **Style:** Clean, minimal, Apple-like
- **Emotional goal:** "This is effortless"

## Storyboard

### Scene 1: Brand Reveal (0:00 - 0:02)
**Duration:** 2 seconds

niotebook wordmark appears like an iPhone notification:
- Central, bold, striking position
- Slides down from top, spring physics
- Holds briefly
- Slides up and out

**Motion:** Spring slide (damping: 100, stiffness: 80)
**SFX:** Single ping (iPhone-like notification tone)
**Assets:** Wordmark SVG (dark variant on black bg)

---

### Scene 2: Workspace Entrance (0:02 - 0:04)
**Duration:** 2 seconds

Workspace interface slides in:
- Right to left spring physics
- Fills the 16:9 frame
- Initial state: 1-pane (video only)
- Video content: CS50x 2026 lecture playing

**Motion:** Spring slide (damping: 200, stiffness: 100, mass: 0.5)
**SFX:** Soft whoosh
**Assets:** Screen recording of 1-pane view with video playing

---

### Scene 3: 1-Pane to 2-Pane (0:04 - 0:06)
**Duration:** 2 seconds

Layout switches to 2-pane:
- Video pane compresses to left column
- AI chat interface slides in from right
- Smooth, snappy transition

**Motion:** Spring layout transition (damping: 300, stiffness: 200)
**SFX:** Click sound on transition
**Assets:** Screen recording showing layout switch to 2-pane

---

### Scene 4: 2-Pane to 3-Pane (0:06 - 0:08)
**Duration:** 2 seconds

Layout switches to 3-pane:
- Video: left column
- Code editor: center column (rises from bottom)
- AI chat: right column
- Full workspace now visible

**Motion:** Spring layout transition
**SFX:** Click sound
**Assets:** Screen recording showing layout switch to 3-pane

---

### Scene 5: Code Pane Focus (0:08 - 0:14)
**Duration:** 6 seconds

Zoom into center pane (code editor):
- Smart zoom to code pane
- Show code being written or executed
- Terminal runs code
- Results appear

**Motion:**
- Zoom in: 0.8s spring
- Hold: 3s
- Activity: during hold
- Zoom out: 0.6s spring

**SFX:**
- Keyboard clicks during typing
- Ping on code execution
- Success tone on result

**Assets:** Screen recording of code editing + terminal execution

---

### Scene 6: Chat Pane Focus (0:14 - 0:20)
**Duration:** 6 seconds

Zoom into right pane (AI chat):
- Smart zoom to chat interface
- Show question being asked
- AI response streaming
- Helpful answer appears

**Motion:** Same pattern as code focus
**SFX:**
- Keyboard clicks during question
- Subtle stream sound during AI response
- Completion ping

**Assets:** Screen recording of AI chat interaction

---

### Scene 7: Full View (0:20 - 0:24)
**Duration:** 4 seconds

Zoom out to full workspace:
- All 3 panes visible
- Video continues playing
- Code runs in terminal
- AI chat shows streamed response
- Everything working together

**Motion:** Zoom out spring (0.6s) + hold
**SFX:** Ambient (existing sounds continue)
**Assets:** Screen recording showing all panes active simultaneously

---

### Scene 8: Layout Dance (0:24 - 0:28)
**Duration:** 4 seconds

Quick layout switching montage:
- 3-pane → 2-pane (code + chat)
- 2-pane → 1-pane (video only)
- Each transition ~1s

**Motion:** Snappy spring transitions
**SFX:** Click on each switch
**Assets:** Screen recordings of each layout state

---

### Scene 9: Loop Return (0:28 - 0:30)
**Duration:** 2 seconds

Return to start state:
- 1-pane snaps out
- Brief black/empty moment
- Ready for logo to appear again

**Motion:** Quick exit, matches Scene 1 entrance timing
**SFX:** Final ping (sets up loop back to Scene 1)
**Assets:** Transition to black

---

## Recording Shot List

Required Screen Studio captures:

1. **1-pane-video.mov** - Video playing in single pane (5s)
2. **1to2-pane.mov** - Layout switch from 1 to 2 pane (2s)
3. **2to3-pane.mov** - Layout switch from 2 to 3 pane (2s)
4. **code-execution.mov** - Writing and running code in editor (8s)
5. **ai-chat.mov** - Asking question and receiving AI response (8s)
6. **full-workspace.mov** - All 3 panes active simultaneously (5s)
7. **layout-dance.mov** - Quick layout switches (6s)

**Screen Studio settings:**
- Resolution: 1920x1080 or higher
- Frame rate: 60fps
- Background: None (capture full window)
- Cursor: Visible, subtle highlight
- Zoom: Manual control or disabled (Remotion handles zoom)

## Composition Notes

### Color Treatment
- Maintain niotebook brand colors
- Slight vignette on edges (subtle)
- No filters or color grading (clean, true to UI)

### Typography
- No text overlays
- Let the UI speak for itself
- Logo only in Scene 1

### Audio Mix
- SFX only, no music
- Consistent levels throughout
- Clean loop at 0:30 → 0:00
