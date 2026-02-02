/**
 * niotebook Brand Constants for Remotion
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
    logo: "Orbitron",
    ui: "Geist Sans",
    mono: "Geist Mono",
  },
} as const;

export const SPRING_CONFIGS = {
  // Smooth, natural entry - panels, workspace
  smooth: { damping: 200, stiffness: 100, mass: 0.5 },
  // Gentle arrival with slight bounce - logo
  gentle: { damping: 100, stiffness: 80, mass: 0.8 },
  // Snappy, responsive - quick switches
  snappy: { damping: 300, stiffness: 200, mass: 0.3 },
  // Deliberate, attention-drawing - zoom focus
  focus: { damping: 150, stiffness: 120, mass: 0.6 },
} as const;

export const TIMING = {
  logoHold: 60, // frames at 60fps = 1s
  panelSlide: 36, // 0.6s
  layoutSwitch: 24, // 0.4s
  zoomIn: 48, // 0.8s
  zoomHold: 150, // 2.5s
  zoomOut: 36, // 0.6s
  breathingPause: 6, // minimum frames between animations
} as const;
