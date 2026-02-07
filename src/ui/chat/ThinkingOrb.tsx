"use client";

import { useEffect, useRef, memo } from "react";

/**
 * Canvas 2D thinking orb — dense dot sphere with fluid heartbeat-like pulse.
 * Terracotta brand theme, inspired by Perplexity.ai's iOS voice orb.
 *
 * Architecture:
 * - ~90 dots arranged in concentric rings on a circle
 * - Each dot has a base position, radius, and phase offset
 * - A global "breath" cycle modulates all dot radii with organic variation
 * - Perlin-like noise (via sin of prime multiples) gives each dot unique jitter
 * - Runs on a single requestAnimationFrame loop, zero React re-renders
 *
 * Performance: ~0.3ms per frame on M1, no DOM nodes, GPU-composited canvas.
 */

type Dot = {
  /** Angle on the circle (radians) */
  angle: number;
  /** Base distance from center (0-1, normalized) */
  radius: number;
  /** Phase offset for organic variation */
  phase: number;
  /** Base dot size (px at 2x DPR) */
  size: number;
  /** Base opacity (0-1) */
  opacity: number;
  /** Ring index (0 = inner, higher = outer) */
  ring: number;
};

const TAU = Math.PI * 2;

/** Generate deterministic dot layout across concentric rings */
const generateDots = (): Dot[] => {
  const dots: Dot[] = [];
  const rings = [
    { count: 8, radius: 0.18, size: 1.8, opacity: 0.9 },
    { count: 14, radius: 0.35, size: 2.0, opacity: 0.75 },
    { count: 20, radius: 0.52, size: 2.2, opacity: 0.6 },
    { count: 24, radius: 0.68, size: 2.0, opacity: 0.45 },
    { count: 28, radius: 0.85, size: 1.6, opacity: 0.3 },
  ];

  for (let ringIdx = 0; ringIdx < rings.length; ringIdx++) {
    const ring = rings[ringIdx]!;
    for (let i = 0; i < ring.count; i++) {
      const angle = (TAU * i) / ring.count + ringIdx * 0.3;
      dots.push({
        angle,
        radius: ring.radius,
        phase: angle * 3.7 + ringIdx * 1.3,
        size: ring.size,
        opacity: ring.opacity,
        ring: ringIdx,
      });
    }
  }

  return dots;
};

const DOTS = generateDots();

/** Organic noise — pseudo-random but deterministic per dot+time */
const noise = (phase: number, t: number): number => {
  return (
    Math.sin(phase + t * 1.7) * 0.3 +
    Math.sin(phase * 2.3 + t * 0.9) * 0.2 +
    Math.sin(phase * 0.7 + t * 2.3) * 0.15
  );
};

/**
 * Heartbeat breath cycle — asymmetric: fast expand, slow contract.
 * Two pulses per cycle (like a real heartbeat: lub-dub).
 */
const heartbeat = (t: number): number => {
  const cycle = t % 1;
  // First beat (lub) — sharp peak at ~0.15
  const lub = Math.exp(-((cycle - 0.15) ** 2) / 0.005) * 0.7;
  // Second beat (dub) — softer peak at ~0.35
  const dub = Math.exp(-((cycle - 0.35) ** 2) / 0.008) * 0.4;
  // Resting baseline
  const rest = 0.0;
  return rest + lub + dub;
};

const drawFrame = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
): void => {
  ctx.clearRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.min(width, height) * 0.42;

  // Global breath — 1.4s per heartbeat cycle
  const breathTime = time / 1.4;
  const breathAmount = heartbeat(breathTime);

  // Read terracotta colors from CSS custom properties
  // Fallback to brand defaults if not available
  const style = getComputedStyle(ctx.canvas);
  const accentColor = style.getPropertyValue("--accent").trim() || "#c15f3c";

  for (let i = 0; i < DOTS.length; i++) {
    const dot = DOTS[i]!;

    // Per-dot organic variation
    const n = noise(dot.phase, time);

    // Radius modulated by heartbeat + noise
    const radiusMod = 1 + breathAmount * (0.12 + dot.ring * 0.04) + n * 0.06;
    const r = dot.radius * maxRadius * radiusMod;

    // Angle with slow drift
    const a = dot.angle + Math.sin(time * 0.5 + dot.phase) * 0.04;

    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;

    // Size pulses with heartbeat (inner dots pulse more)
    const sizeMod = 1 + breathAmount * (0.3 - dot.ring * 0.04) + n * 0.1;
    const size = dot.size * sizeMod;

    // Opacity brightens on heartbeat peaks
    const opacityMod = dot.opacity + breathAmount * 0.25 + n * 0.05;
    const opacity = Math.min(1, Math.max(0.1, opacityMod));

    ctx.beginPath();
    ctx.arc(x, y, size, 0, TAU);
    ctx.fillStyle = accentColor;
    ctx.globalAlpha = opacity;
    ctx.fill();
  }

  // Center glow on heartbeat
  if (breathAmount > 0.1) {
    const glowRadius = maxRadius * 0.3 * breathAmount;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
    gradient.addColorStop(0, accentColor);
    gradient.addColorStop(1, "transparent");
    ctx.globalAlpha = breathAmount * 0.15;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, glowRadius, 0, TAU);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
};

const ThinkingOrb = memo(function ThinkingOrb() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Check for reduced motion preference
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const dpr = window.devicePixelRatio || 2;
    const displaySize = 40; // CSS pixels
    canvas.width = displaySize * dpr;
    canvas.height = displaySize * dpr;
    canvas.style.width = `${displaySize}px`;
    canvas.style.height = `${displaySize}px`;
    ctx.scale(dpr, dpr);

    // For reduced motion: draw a single static frame
    if (prefersReduced) {
      drawFrame(ctx, displaySize, displaySize, 0);
      return;
    }

    let startTime: number | null = null;

    const animate = (timestamp: number): void => {
      if (startTime === null) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000; // seconds

      drawFrame(ctx, displaySize, displaySize, elapsed);
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="nio-thinking-orb"
      aria-label="Assistant is thinking"
      role="img"
    />
  );
});

export { ThinkingOrb };
