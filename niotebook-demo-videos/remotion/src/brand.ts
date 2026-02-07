/**
 * niotebook Brand Constants
 */

export const BRAND = {
  colors: {
    black: "#0A0A0A",
    white: "#FAFAFA",
    gray900: "#171717",
    gray700: "#404040",
    gray400: "#A3A3A3",
    gray100: "#F5F5F5",
    acidGreen: "#00FF66",
    greenDim: "#00CC52",
  },
  fonts: {
    logo: "Orbitron, sans-serif",
    ui: "system-ui, -apple-system, sans-serif",
    mono: "ui-monospace, monospace",
  },
} as const;

// Spring configurations for different animation feels
export const SPRING_CONFIGS = {
  // Smooth panel slide-in
  smooth: { damping: 200, stiffness: 100, mass: 0.5 },
  // Gentle logo reveal
  gentle: { damping: 100, stiffness: 80, mass: 0.8 },
  // Snappy layout switches
  snappy: { damping: 300, stiffness: 200, mass: 0.3 },
  // Deliberate zoom focus
  focus: { damping: 150, stiffness: 120, mass: 0.6 },
} as const;

// Video configuration - native resolution from recordings
export const VIDEO_CONFIG = {
  width: 1660,
  height: 1080,
  fps: 60,
  durationInSeconds: 30,
  durationInFrames: 1800, // 30s * 60fps
} as const;

// Timing in frames (at 60fps)
export const TIMING = {
  // Logo sequence
  logoEnter: 30, // 0.5s
  logoHold: 60, // 1s
  logoExit: 30, // 0.5s

  // Transitions
  slideIn: 36, // 0.6s
  layoutSwitch: 18, // 0.3s

  // Zoom
  zoomIn: 30, // 0.5s
  zoomHold: 90, // 1.5s
  zoomOut: 24, // 0.4s

  // Spacing
  breathe: 6, // 0.1s minimum between animations
} as const;

// Sequence timing (frame numbers)
export const SEQUENCE = {
  logo: { start: 0, duration: 120 }, // 0:00-0:02
  workspaceEntry: { start: 100, duration: 120 }, // 0:01.67-0:03.67
  layoutMontage: { start: 200, duration: 360 }, // 0:03.33-0:09.33
  codeZoom: { start: 540, duration: 240 }, // 0:09-0:13
  aiChatHero: { start: 760, duration: 480 }, // 0:12.67-0:20.67
  fullWorkspace: { start: 1200, duration: 180 }, // 0:20-0:23
  layoutDance: { start: 1360, duration: 240 }, // 0:22.67-0:26.67
  exitLoop: { start: 1580, duration: 120 }, // 0:26.33-0:28.33
} as const;
