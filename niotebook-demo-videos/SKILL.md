---
name: niotebook-demo-videos
description: Create short (~30s) looping stylized tech product demo videos for niotebook using Remotion. Use when asked to make demo videos, product videos, launch videos, marketing videos, or promotional content for niotebook. Triggers on requests like "make a demo video", "create a product video", "video for landing page", "social media video", or "launch video".
---

# niotebook Demo Videos

Create polished, seamless-looping demo videos with clean Apple-like aesthetics and AI-generated SFX.

## Quick Start

1. **Storyboard** the video (or use existing storyboard)
2. **Record** required footage with Screen Studio
3. **Generate** video with Remotion
4. **Export** to platform presets

## Prerequisites

This skill requires the [Remotion skill](https://github.com/remotion-dev/skills). Install if not present:

```bash
npx skills add remotion-dev/skills
```

## Workflow

### Phase 1: Storyboarding

For new videos, create a storyboard first. See [references/storyboarding.md](references/storyboarding.md).

```yaml
# Minimal storyboard template
title: [Video name]
duration: 30s
aspect: 16:9
scenes:
  - name: [Scene]
    duration: [X]s
    description: [What happens]
    assets_needed: [Recordings needed]
```

For the flagship workspace demo, use [references/flagship-demo.md](references/flagship-demo.md).

### Phase 2: Recording

Record footage with Screen Studio Pro:
- Resolution: 1920x1080+ at 60fps
- Window capture (not full screen)
- Cursor visible with subtle highlight
- Disable auto-zoom (Remotion handles zooms)

### Phase 3: Generation

Generate video using Remotion with these niotebook-specific patterns:

#### Project Setup

```tsx
// src/Root.tsx
import { Composition } from "remotion";
import { NiotebookDemo } from "./NiotebookDemo";

export const RemotionRoot = () => {
  return (
    <Composition
      id="NiotebookDemo"
      component={NiotebookDemo}
      durationInFrames={30 * 60} // 30s at 60fps
      fps={60}
      width={1920}
      height={1080}
    />
  );
};
```

#### Brand Constants

```tsx
// src/brand.ts
export const BRAND = {
  colors: {
    black: "#0A0A0A",
    white: "#FAFAFA",
    gray900: "#171717",
    gray700: "#404040",
    gray400: "#A3A3A3",
    acidGreen: "#00FF66",
  },
  fonts: {
    logo: "Orbitron",
    ui: "Geist Sans",
    mono: "Geist Mono",
  },
};
```

#### Motion Patterns

Use spring physics for all animations. See [references/motion-patterns.md](references/motion-patterns.md).

```tsx
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

// Standard panel slide-in
const slideIn = spring({
  frame,
  fps,
  config: { damping: 200, stiffness: 100, mass: 0.5 },
});
```

#### Logo Component

```tsx
// Notification-style logo reveal
export const LogoReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 100, stiffness: 80, mass: 0.8 } });
  const exit = spring({ frame: frame - 60, fps, config: { damping: 100, stiffness: 80 } });

  const y = enter * 100 - exit * 100; // Slides down then up
  const opacity = enter - exit;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <img
        src={staticFile("branding/logos/wordmark/dark/wordmark.svg")}
        style={{ transform: `translateY(${y}px)`, opacity }}
      />
    </AbsoluteFill>
  );
};
```

### Phase 4: Audio

Generate SFX using AI or select from library. See [references/sfx-guide.md](references/sfx-guide.md).

**Sound types needed:**
- Notification ping (logo reveal)
- Click (layout switches)
- Whoosh (panel slides)
- Keyboard clicks (typing)
- Success ping (code execution)

```tsx
import { Audio, staticFile } from "remotion";

<Audio src={staticFile("sfx/ping.wav")} startFrom={0} />
```

### Phase 5: Export

Export to all platform presets. See [references/platform-presets.md](references/platform-presets.md).

```bash
# Master render
npx remotion render src/index.ts NiotebookDemo out/master.mp4

# Platform variants (use ffmpeg for resizing)
ffmpeg -i out/master.mp4 -vf "scale=1200:1200" out/twitter-square.mp4
ffmpeg -i out/master.mp4 -vf "scale=1080:1920" out/vertical.mp4
```

## Key Principles

### The "Effortless" Aesthetic
- Spring physics on everything (no linear motion)
- Generous timing (slow down when in doubt)
- One animation at a time (no competing motions)
- Breathing room between actions

### Seamless Looping
- End state must match start state
- No audio bleed across loop point
- Final scene returns to initial conditions

### No Text Overlays
- Product speaks for itself
- Logo only at start
- UI text is sufficient

## Assets

### Remotion Templates
Pre-built components in `assets/remotion-templates/`:
- `brand.ts` — Colors, fonts, spring configs, timing constants
- `LogoReveal.tsx` — Notification-style logo animation
- `WorkspaceSlide.tsx` — Panel slide-in with spring physics
- `SmartZoom.tsx` — Context-aware zoom to UI elements

Copy to your Remotion project:
```bash
cp assets/remotion-templates/*.tsx src/components/
cp assets/remotion-templates/brand.ts src/
```

### Brand Assets
Reference existing assets in the project:
- Logos: `branding/logos/`
- Social templates: `branding/social/`
- Brand guide: `branding/README.md`

## References

| File | Purpose |
|------|---------|
| [motion-patterns.md](references/motion-patterns.md) | Spring physics, easing, zoom patterns |
| [platform-presets.md](references/platform-presets.md) | Export specs for all platforms |
| [storyboarding.md](references/storyboarding.md) | Planning framework and templates |
| [sfx-guide.md](references/sfx-guide.md) | Sound design guidelines |
| [flagship-demo.md](references/flagship-demo.md) | Detailed storyboard for workspace demo |
