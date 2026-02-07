# Storyboarding Framework

Guide for planning niotebook demo videos.

## Storyboard Template

For each video, define:

```yaml
title: [Video name]
duration: 30s
aspect: 16:9
loop_type: seamless
emotional_goal: "This is effortless"

scenes:
  - id: 1
    name: [Scene name]
    duration: [X]s
    description: [What happens]
    assets_needed:
      - [List of recordings/images needed]
    motion: [Animation style]
    sfx: [Sound effect type]

  - id: 2
    ...
```

## Scene Types

### 1. Brand Reveal

Logo/wordmark appearance to establish identity.

**Pattern:**

- Duration: 2-3s
- Motion: Spring fade-in or notification-style slide
- SFX: Subtle ping or chime
- Background: Solid black or brand gradient

**Recording needed:** None (use brand assets)

### 2. Interface Entrance

Workspace UI sliding into frame.

**Pattern:**

- Duration: 1-2s
- Motion: Spring slide from edge (direction matches layout)
- SFX: Soft whoosh or none
- Show: Full interface in starting state

**Recording needed:** Static screenshot or video of UI in start state

### 3. Layout Transition

Switching between 1/2/3 pane configurations.

**Pattern:**

- Duration: 0.5-1s
- Motion: Panels slide to new positions
- SFX: Click or tap sound
- Show: UI reorganizing smoothly

**Recording needed:** Video showing each layout state

### 4. Feature Focus

Zooming into specific UI element to highlight capability.

**Pattern:**

- Duration: 3-5s (zoom in + hold + zoom out)
- Motion: Smooth zoom with smart framing
- SFX: Subtle ping at key moment
- Show: Specific interaction in detail

**Recording needed:** Detailed recording of the feature in action

### 5. Action Sequence

Showing actual usage (typing, clicking, results).

**Pattern:**

- Duration: 3-8s depending on action
- Motion: Smart zoom follows action, may pan
- SFX: Keyboard clicks, UI feedback sounds
- Show: Real interaction, real results

**Recording needed:** Screen recording of complete action

### 6. Montage Cut

Quick cuts between multiple views/features.

**Pattern:**

- Duration: 0.5-1s per cut
- Motion: Hard cuts or quick crossfades
- SFX: Rhythmic clicks synced to cuts
- Show: Variety of capabilities

**Recording needed:** Multiple short clips

### 7. Loop Return

Transitioning back to start state for seamless loop.

**Pattern:**

- Duration: 1-2s
- Motion: Match end state to start state
- SFX: Final ping that sets up loop
- Show: UI returning to initial state

**Recording needed:** Same as scene 1 start state

## Planning Questions

When storyboarding a new video, answer:

1. **What's the one message?**
   - Not "show everything" — what's the single takeaway?

2. **What's the hero moment?**
   - The 3-5 second segment that makes viewers go "whoa"

3. **What's the loop logic?**
   - How does the end state connect to the start?

4. **What recordings are needed?**
   - List specific Screen Studio captures required

5. **What's the rhythm?**
   - Slow build → climax → resolution
   - Or: punch-punch-punch (montage)

## Recording Checklist

Before recording with Screen Studio:

- [ ] Clean desktop (hide irrelevant apps)
- [ ] niotebook in correct starting state
- [ ] Test data loaded (realistic looking content)
- [ ] Window sized for target aspect ratio
- [ ] Screen Studio preset configured
- [ ] Know the exact actions to perform
- [ ] Practice run completed

## Timing Rules

- **Minimum scene duration**: 1.5s (viewers need time to parse)
- **Maximum hold on static**: 3s (then add motion)
- **Action pacing**: Slightly slower than natural (feels more intentional)
- **Loop point**: End on a "resolved" state (not mid-action)

## Example: Feature Demo

```yaml
title: AI Chat Feature Demo
duration: 30s
aspect: 16:9
loop_type: seamless
emotional_goal: "This is effortless"

scenes:
  - id: 1
    name: Logo flash
    duration: 2s
    description: niotebook wordmark appears center, notification style
    motion: spring slide-down + fade
    sfx: ping

  - id: 2
    name: Workspace entry
    duration: 1.5s
    description: 3-pane workspace slides in from right
    motion: spring slide, all panes together
    sfx: soft whoosh

  - id: 3
    name: Question typed
    duration: 4s
    description: User types question in chat pane
    assets_needed: [chat-typing.mov]
    motion: smart zoom to chat pane
    sfx: keyboard clicks

  - id: 4
    name: AI responds
    duration: 5s
    description: AI streams response with code suggestion
    assets_needed: [ai-response.mov]
    motion: hold zoom on chat
    sfx: subtle typing/stream sound

  - id: 5
    name: Code applied
    duration: 4s
    description: Suggested code appears in editor
    assets_needed: [code-insert.mov]
    motion: pan to code pane
    sfx: click + success ping

  # ... continue to loop return
```
