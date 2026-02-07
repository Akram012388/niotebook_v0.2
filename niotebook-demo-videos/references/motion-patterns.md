# Motion Design Patterns

Core motion principles for niotebook's "effortless" aesthetic.

## Spring Physics

Use Remotion's `spring()` for all UI element animations:

```tsx
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

const frame = useCurrentFrame();
const { fps } = useVideoConfig();

// Smooth, natural entry
const slideIn = spring({
  frame,
  fps,
  config: {
    damping: 200,
    stiffness: 100,
    mass: 0.5,
  },
});
```

### Presets

| Use Case           | Damping | Stiffness | Mass | Feel                              |
| ------------------ | ------- | --------- | ---- | --------------------------------- |
| **Panel slide-in** | 200     | 100       | 0.5  | Smooth glide, minimal overshoot   |
| **Logo appear**    | 100     | 80        | 0.8  | Gentle arrival with slight bounce |
| **Quick switch**   | 300     | 200       | 0.3  | Snappy, responsive                |
| **Zoom focus**     | 150     | 120       | 0.6  | Deliberate, attention-drawing     |

## Easing Curves

For non-spring animations, use these timing functions:

```tsx
import { interpolate, Easing } from "remotion";

// Elegant slow reveal
const slow = interpolate(frame, [0, 60], [0, 1], {
  easing: Easing.bezier(0.25, 0.1, 0.25, 1), // ease-out-cubic
});

// Snappy response
const snappy = interpolate(frame, [0, 15], [0, 1], {
  easing: Easing.bezier(0.34, 1.56, 0.64, 1), // ease-out-back
});
```

## Smart Zoom Patterns

### Focus Zoom

Draw attention to a specific UI element:

```tsx
const zoomIn = spring({ frame: frame - startFrame, fps, config: { damping: 150, stiffness: 120, mass: 0.6 } });

<AbsoluteFill style={{
  transform: `scale(${1 + zoomIn * 0.5}) translate(${-targetX * zoomIn}px, ${-targetY * zoomIn}px)`,
}}>
```

### Contextual Zoom

Zoom to element while maintaining spatial context:

- Max zoom: 1.5x (don't lose context)
- Always ease in AND out
- Hold at zoom for 2-3 seconds minimum

## Layout Transitions

### Pane Count Changes

When switching between 1/2/3 pane layouts:

1. Current panes slide out (spring, 12 frames)
2. Brief pause (3 frames)
3. New panes slide in from edges (spring, 18 frames)

```tsx
// 1-pane to 2-pane
const exitLeft = spring({
  frame,
  fps,
  config: { damping: 200, stiffness: 150 },
});
const enterRight = spring({
  frame: frame - 15,
  fps,
  config: { damping: 200, stiffness: 100 },
});
```

### Slide Direction Convention

- Left pane: enters from left
- Center pane: enters from bottom (rises up)
- Right pane: enters from right

## Parallax Depth

For multi-layer compositions, create depth with differential motion:

```tsx
// Background moves slower
const bgMove = spring({ ... }) * 0.3;
// Midground
const midMove = spring({ ... }) * 0.6;
// Foreground (UI) moves at full speed
const fgMove = spring({ ... }) * 1.0;
```

## Timing Guidelines

| Element         | Minimum Duration | Notes                |
| --------------- | ---------------- | -------------------- |
| Logo appearance | 1.5s             | Let it breathe       |
| Panel slide     | 0.6-0.8s         | Smooth, not rushed   |
| Layout switch   | 0.4s             | Snappy but readable  |
| Zoom in         | 0.8s             | Deliberate focus     |
| Zoom hold       | 2-3s             | Time to comprehend   |
| Zoom out        | 0.6s             | Slightly faster exit |

## The "Effortless" Checklist

Before rendering, verify:

- [ ] No abrupt stops (everything springs or eases)
- [ ] No competing motions (one main animation at a time)
- [ ] Generous timing (when in doubt, slow down)
- [ ] Consistent direction logic (left enters left, etc.)
- [ ] Breathing room between actions (min 6 frames pause)
