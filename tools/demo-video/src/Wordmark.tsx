import React from "react";
import { interpolate, spring, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Orbitron";
import { BRAND, TIMING, WORDMARK_CONFIG, I_DOT, VIDEO } from "./constants";

const { fontFamily: orbitron } = loadFont();

export const Wordmark: React.FC = () => {
  const frame = useCurrentFrame();
  const { wordmark: wm } = TIMING;
  const { fontSize, letterSpacing } = WORDMARK_CONFIG;

  // ── Phase 1: Pop in ───────────────────────────────────────────
  const popProgress = spring({
    frame: frame - wm.popStart,
    fps: VIDEO.fps,
    config: { mass: 0.8, stiffness: 120, damping: 14 },
  });
  const popScale = interpolate(popProgress, [0, 1], [0.85, 1]);
  const popOpacity = interpolate(popProgress, [0, 1], [0, 1]);

  // ── Phase 5: Snap out ─────────────────────────────────────────
  const isSnapping = frame >= wm.snapStart;
  const snapProgress = isSnapping
    ? interpolate(
        frame,
        [wm.snapStart, wm.snapStart + wm.snapDuration],
        [0, 1],
        { extrapolateRight: "clamp" },
      )
    : 0;
  const snapScale = isSnapping
    ? interpolate(snapProgress, [0, 0.2, 1], [1, 1.06, 0])
    : 1;
  const snapOpacity = isSnapping
    ? interpolate(snapProgress, [0, 0.3, 1], [1, 1, 0])
    : 1;

  const scale = popScale * snapScale;
  const opacity = popOpacity * snapOpacity;

  // ── Phase 3: "i" dot-bounce (punchy!) ─────────────────────────
  const isBouncing =
    frame >= wm.iBounceStart &&
    frame < wm.iBounceStart + wm.iBounceDuration;
  const bf = Math.max(0, frame - wm.iBounceStart);

  // Stick: sharp jump up → spring back with overshoot (px scaled for 288px font)
  const stickY = isBouncing
    ? interpolate(bf, [0, 10, 22, 34, 48], [0, -41, 0, 5, 0], {
        extrapolateRight: "clamp",
        extrapolateLeft: "clamp",
      })
    : 0;

  // Dot: tracks stick for first 8 frames, then launches way up, springs back
  const dotY = isBouncing
    ? interpolate(
        bf,
        [0, 8, 10, 18, 30, 38, 44, 48],
        [0, -32, -59, -108, 12, -5, 3, 0],
        { extrapolateRight: "clamp", extrapolateLeft: "clamp" },
      )
    : 0;

  // ── Styles ────────────────────────────────────────────────────
  const charStyle: React.CSSProperties = {
    fontFamily: orbitron,
    fontWeight: 700,
    fontSize,
    lineHeight: 1.2,
    letterSpacing,
    color: BRAND.foreground,
    userSelect: "none",
  };

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        opacity,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline" }}>
        {/* "n" */}
        <span style={charStyle}>n</span>

        {/* Animated "i" — mask + separate dot */}
        <span
          style={{
            position: "relative",
            display: "inline-block",
            fontFamily: orbitron,
            fontWeight: 800,
            fontSize,
            lineHeight: 1.2,
            letterSpacing,
            userSelect: "none",
          }}
        >
          {/* Full "i" character — moves with stick */}
          <span
            style={{
              display: "inline-block",
              color: BRAND.accent,
              transform: `translateY(${stickY}px)`,
            }}
          >
            i
          </span>

          {/* Mask: bg-colored rect hides the original dot + gap (tracks stick) */}
          {isBouncing && (
            <div
              style={{
                position: "absolute",
                left: -I_DOT.maskPadSide,
                right: -I_DOT.maskPadSide,
                top: I_DOT.offsetTop - I_DOT.maskPadTop,
                height:
                  I_DOT.height + I_DOT.maskPadTop + I_DOT.maskPadBottom,
                backgroundColor: BRAND.background,
                transform: `translateY(${stickY}px)`,
              }}
            />
          )}

          {/* Animated dot — pixel-matched to font, bounces independently */}
          {isBouncing && (
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: I_DOT.offsetTop,
                width: I_DOT.width,
                height: I_DOT.height,
                backgroundColor: BRAND.accent,
                borderRadius: I_DOT.borderRadius,
                transform: `translateX(-50%) translateY(${dotY}px)`,
              }}
            />
          )}
        </span>

        {/* "otebook" */}
        <span style={charStyle}>otebook</span>
      </div>
    </div>
  );
};
