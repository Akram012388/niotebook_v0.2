/**
 * niotebook Logo Reveal Component
 *
 * Notification-style logo that slides down, holds, then slides up.
 * Used at the start of demo videos.
 */

import React from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  Img,
} from "remotion";
import { BRAND, SPRING_CONFIGS, TIMING } from "./brand";

interface LogoRevealProps {
  /** Frame when logo starts appearing */
  startFrame?: number;
  /** Frame when logo starts exiting */
  exitFrame?: number;
  /** Use dark or light variant */
  variant?: "dark" | "light";
}

export const LogoReveal: React.FC<LogoRevealProps> = ({
  startFrame = 0,
  exitFrame = TIMING.logoHold,
  variant = "dark",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Enter animation (slide down)
  const enter = spring({
    frame: frame - startFrame,
    fps,
    config: SPRING_CONFIGS.gentle,
  });

  // Exit animation (slide up)
  const exit = spring({
    frame: frame - exitFrame,
    fps,
    config: SPRING_CONFIGS.gentle,
  });

  // Combined transform: slide down on enter, slide up on exit
  const y = -100 + enter * 100 - exit * 100;
  const opacity = Math.min(enter, 1 - exit);

  const logoPath =
    variant === "dark"
      ? "branding/logos/wordmark/dark/wordmark.svg"
      : "branding/logos/wordmark/light/wordmark.svg";

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.colors.black,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Img
        src={staticFile(logoPath)}
        style={{
          transform: `translateY(${y}px)`,
          opacity,
          maxWidth: "60%",
        }}
      />
    </AbsoluteFill>
  );
};
