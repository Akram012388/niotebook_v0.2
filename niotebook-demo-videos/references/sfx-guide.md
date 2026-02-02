# UI Sound Effects Guide

Sound design for niotebook's "effortless" aesthetic.

## Sound Philosophy

**Core principle:** Sounds should feel like natural extensions of the UI — present but not distracting. Think iOS system sounds: functional, pleasant, almost subliminal.

**Characteristics:**
- Clean, digital but warm
- Short duration (50-300ms)
- Mid-to-high frequency (no deep bass)
- Consistent tonal family across all sounds

## SFX Categories

### 1. Notification / Attention

For logo appearances, important moments.

**Sound profile:**
- Bright, clear tone
- Single note or short chord
- 150-250ms duration
- Gentle attack, quick decay

**Reference:** iOS notification ping, Slack mention sound

**When to use:**
- Logo/brand reveal
- Key moment highlight
- Success confirmation

### 2. Click / Tap

For button presses, selections, layout switches.

**Sound profile:**
- Crisp, tactile
- Very short (30-80ms)
- Subtle low-mid thud + high click
- No reverb

**Reference:** macOS button click, keyboard key press

**When to use:**
- Layout transitions
- Menu selections
- Any discrete UI action

### 3. Whoosh / Slide

For panel movements, transitions.

**Sound profile:**
- Soft, airy
- 200-400ms duration
- Directional feel (left-right matches visual)
- Low volume, background presence

**Reference:** iOS page swipe, macOS window minimize

**When to use:**
- Panel slide-ins
- Content transitions
- Zoom movements

### 4. Keyboard / Typing

For text input sequences.

**Sound profile:**
- Mechanical but soft
- Varied pitch per keystroke (avoid repetition)
- 20-50ms per key
- Light, not clacky

**Reference:** Apple Magic Keyboard (not mechanical)

**When to use:**
- User typing in chat
- Code being written
- Search input

### 5. Success / Completion

For code execution, AI response complete.

**Sound profile:**
- Ascending tone or chord
- Satisfying resolution
- 200-400ms
- Warm, positive

**Reference:** iOS payment success, achievement unlock

**When to use:**
- Code runs successfully
- AI finishes responding
- Task completion

## AI Sound Generation

When generating SFX with AI tools (ElevenLabs, etc.):

**Prompt template:**
```
Create a UI sound effect for [action type].
Style: Clean, digital, minimal, Apple-like.
Duration: [X]ms.
Character: [specific description].
No reverb, dry signal, suitable for looping video.
```

**Example prompts:**

Notification ping:
```
Create a UI notification sound. Style: Clean, digital, minimal, like iOS.
Duration: 200ms. A bright, clear two-note ascending tone.
Gentle attack, quick decay. Warm but digital. No reverb.
```

Click:
```
Create a UI click sound. Style: Clean, tactile, like macOS button.
Duration: 50ms. A soft, satisfying tap with subtle low-end thud.
Dry signal, no reverb or echo.
```

## Mixing Guidelines

| Sound Type | Relative Volume | Pan |
|------------|-----------------|-----|
| Notification | 100% | Center |
| Click | 60-70% | Match visual position |
| Whoosh | 40-50% | Follow motion direction |
| Typing | 50-60% | Center or slight spread |
| Success | 80-90% | Center |

## Timing Rules

- **Sync to visual:** Sound should hit on the frame the action completes
- **Lead time:** For anticipatory sounds (whoosh), start 2-3 frames before visual
- **Overlap:** Never overlap two sounds of the same type
- **Silence:** Leave 10+ frames between distinct sounds
- **Loop point:** Ensure no sound bleeds across loop boundary

## Quality Checklist

Before final render:
- [ ] All sounds are normalized to consistent levels
- [ ] No clipping or distortion
- [ ] Sounds sync precisely with visuals
- [ ] No awkward silence gaps
- [ ] Loop point has clean audio transition
- [ ] Overall mix isn't fatiguing on repeat

## File Specifications

For bundled SFX assets:
- Format: WAV (uncompressed) or high-bitrate MP3
- Sample rate: 48kHz
- Bit depth: 24-bit
- Channels: Stereo (even for centered sounds)
