# Remotion Templates

Pre-built components for niotebook demo videos.

## Usage

Copy these files into your Remotion project's `src/` directory:

```bash
cp assets/remotion-templates/*.tsx my-remotion-project/src/components/
cp assets/remotion-templates/brand.ts my-remotion-project/src/
```

## Components

### brand.ts
Brand constants, spring configs, and timing values.

### LogoReveal.tsx
Notification-style logo animation for video intros.

```tsx
<LogoReveal startFrame={0} exitFrame={60} variant="dark" />
```

### WorkspaceSlide.tsx
Slides workspace UI into frame with spring physics.

```tsx
<WorkspaceSlide
  videoSrc="recordings/workspace.mp4"
  startFrame={120}
  direction="right"
/>
```

### SmartZoom.tsx
Zooms into specific UI areas while maintaining context.

```tsx
<SmartZoom
  videoSrc="recordings/workspace.mp4"
  zoomInFrame={180}
  targetX={0.7}  // Right side (code pane)
  targetY={0.5}  // Vertically centered
  maxZoom={1.5}
/>
```

## Composition Example

```tsx
import { Sequence } from "remotion";
import { LogoReveal } from "./components/LogoReveal";
import { WorkspaceSlide } from "./components/WorkspaceSlide";
import { SmartZoom } from "./components/SmartZoom";

export const NiotebookDemo = () => {
  return (
    <>
      {/* Logo reveal: 0-2s */}
      <Sequence from={0} durationInFrames={120}>
        <LogoReveal />
      </Sequence>

      {/* Workspace slides in: 2-4s */}
      <Sequence from={120} durationInFrames={120}>
        <WorkspaceSlide videoSrc="workspace.mp4" direction="right" />
      </Sequence>

      {/* Zoom to code pane: 8-14s */}
      <Sequence from={480}>
        <SmartZoom
          videoSrc="workspace.mp4"
          zoomInFrame={0}
          targetX={0.5}
          targetY={0.5}
        />
      </Sequence>
    </>
  );
};
```
