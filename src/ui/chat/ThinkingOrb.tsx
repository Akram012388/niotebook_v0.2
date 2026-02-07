"use client";

import { useEffect, useRef, memo } from "react";

/**
 * Canvas 2D thinking orb — spaced-out dot circle with gentle fluid breathing.
 * Terracotta brand theme. Lightweight, airy, organic.
 *
 * ~30 dots across 3 rings with generous spacing. Slow sinusoidal breath
 * gives a calm "AI is alive" feel without being busy or aggressive.
 */

type Dot = {
  angle: number;
  radius: number;
  phase: number;
  size: number;
  opacity: number;
  ring: number;
};

const TAU = Math.PI * 2;

const generateDots = (): Dot[] => {
  const dots: Dot[] = [];
  const rings = [
    { count: 6, radius: 0.22, size: 1.2, opacity: 0.85 },
    { count: 10, radius: 0.50, size: 1.1, opacity: 0.55 },
    { count: 14, radius: 0.80, size: 0.9, opacity: 0.30 },
  ];

  for (let ringIdx = 0; ringIdx < rings.length; ringIdx++) {
    const ring = rings[ringIdx]!;
    for (let i = 0; i < ring.count; i++) {
      const angle = (TAU * i) / ring.count + ringIdx * 0.5;
      dots.push({
        angle,
        radius: ring.radius,
        phase: angle * 2.3 + ringIdx * 1.7,
        size: ring.size,
        opacity: ring.opacity,
        ring: ringIdx,
      });
    }
  }

  return dots;
};

const DOTS = generateDots();

const noise = (phase: number, t: number): number => {
  return (
    Math.sin(phase + t * 1.1) * 0.25 +
    Math.sin(phase * 1.7 + t * 0.7) * 0.15
  );
};

/** Gentle sinusoidal breath — slow inhale/exhale, 2.4s cycle */
const breath = (t: number): number => {
  return (Math.sin(t * TAU) + 1) * 0.5;
};

const drawFrame = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  accentColor: string,
): void => {
  ctx.clearRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.min(width, height) * 0.40;

  // 2.4s breath cycle
  const breathAmount = breath(time / 2.4);

  for (let i = 0; i < DOTS.length; i++) {
    const dot = DOTS[i]!;
    const n = noise(dot.phase, time);

    // Gentle radius modulation
    const radiusMod = 1 + breathAmount * 0.10 + n * 0.05;
    const r = dot.radius * maxRadius * radiusMod;

    // Subtle angular drift
    const a = dot.angle + Math.sin(time * 0.4 + dot.phase) * 0.06;

    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;

    // Gentle size pulse
    const sizeMod = 1 + breathAmount * 0.15 + n * 0.08;
    const size = dot.size * sizeMod;

    // Opacity modulated by breath
    const opacityMod = dot.opacity + breathAmount * 0.15 + n * 0.04;
    const opacity = Math.min(1, Math.max(0.08, opacityMod));

    ctx.beginPath();
    ctx.arc(x, y, size, 0, TAU);
    ctx.fillStyle = accentColor;
    ctx.globalAlpha = opacity;
    ctx.fill();
  }

  // Soft center glow
  if (breathAmount > 0.3) {
    const glowRadius = maxRadius * 0.25 * breathAmount;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
    gradient.addColorStop(0, accentColor);
    gradient.addColorStop(1, "transparent");
    ctx.globalAlpha = breathAmount * 0.08;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, glowRadius, 0, TAU);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
};

const DISPLAY_SIZE = 32;

const ThinkingOrb = memo(function ThinkingOrb() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const dpr = window.devicePixelRatio || 2;
    canvas.width = DISPLAY_SIZE * dpr;
    canvas.height = DISPLAY_SIZE * dpr;
    canvas.style.width = `${DISPLAY_SIZE}px`;
    canvas.style.height = `${DISPLAY_SIZE}px`;
    ctx.scale(dpr, dpr);

    // Read accent color once (doesn't change mid-stream)
    const style = getComputedStyle(canvas);
    const accentColor = style.getPropertyValue("--accent").trim() || "#c15f3c";

    if (prefersReduced) {
      drawFrame(ctx, DISPLAY_SIZE, DISPLAY_SIZE, 0, accentColor);
      return;
    }

    let startTime: number | null = null;

    const animate = (timestamp: number): void => {
      if (startTime === null) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000;
      drawFrame(ctx, DISPLAY_SIZE, DISPLAY_SIZE, elapsed, accentColor);
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
