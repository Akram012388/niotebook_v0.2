import React from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  Img,
  interpolate,
} from "remotion";
import { BRAND, SPRING_CONFIGS } from "../brand";

interface LogoRevealProps {
  enterDuration?: number;
  holdDuration?: number;
  exitDuration?: number;
}

export const LogoReveal: React.FC<LogoRevealProps> = ({
  enterDuration = 30,
  holdDuration = 60,
  exitDuration = 30,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Enter: slide down from top
  const enterProgress = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.gentle,
  });

  // Exit: slide up and fade
  const exitStart = enterDuration + holdDuration;
  const exitProgress = spring({
    frame: Math.max(0, frame - exitStart),
    fps,
    config: SPRING_CONFIGS.gentle,
  });

  // Y position: starts above (-100), enters to center (0), exits up (-100)
  const y = interpolate(
    enterProgress - exitProgress,
    [-1, 0, 1],
    [-100, 0, -100],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Opacity: fade in, hold, fade out
  const opacity = Math.min(enterProgress, 1 - exitProgress);

  // Scale: subtle pulse on enter
  const scale = interpolate(enterProgress, [0, 1], [0.9, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.colors.black,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Img
        src={staticFile("branding/wordmark/niotebook-wordmark-dark.png")}
        style={{
          transform: `translateY(${y}px) scale(${scale})`,
          opacity,
          width: "50%",
          maxWidth: 600,
        }}
      />
    </AbsoluteFill>
  );
};
