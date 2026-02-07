import React from "react";
import { interpolate, spring, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Geist";
import { BRAND, TIMING, WORDMARK_CONFIG, VIDEO } from "./constants";

const { fontFamily: geist } = loadFont("normal", {
  weights: ["700"],
  subsets: ["latin"],
});

export const Tagline: React.FC = () => {
  const frame = useCurrentFrame();
  const { tagline: tl } = TIMING;
  const localFrame = frame - tl.start;

  // Pop in
  const popProgress = spring({
    frame: localFrame,
    fps: VIDEO.fps,
    config: { mass: 0.6, stiffness: 150, damping: 15 },
  });
  const popScale = interpolate(popProgress, [0, 1], [0.85, 1]);
  const popOpacity = interpolate(popProgress, [0, 1], [0, 1]);

  // Snap out
  const isSnapping = frame >= tl.snapStart;
  const snapProgress = isSnapping
    ? interpolate(
        frame,
        [tl.snapStart, tl.snapStart + tl.snapDuration],
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

  const wordStyle: React.CSSProperties = {
    fontFamily: geist,
    fontWeight: 700,
    fontSize: WORDMARK_CONFIG.taglineFontSize,
    lineHeight: 1,
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
        gap: WORDMARK_CONFIG.taglineGap,
      }}
    >
      <span style={{ ...wordStyle, color: BRAND.foreground }}>Watch.</span>
      <span style={{ ...wordStyle, color: BRAND.accent }}>Code.</span>
      <span style={{ ...wordStyle, color: BRAND.foreground }}>Learn.</span>
    </div>
  );
};
