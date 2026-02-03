import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  spring,
  useVideoConfig,
} from "remotion";
import { BRAND, SPRING_CONFIGS } from "../brand";

interface TransitionProps {
  type: "fadeIn" | "fadeOut" | "crossfade";
  duration?: number;
  children: React.ReactNode;
}

export const Transition: React.FC<TransitionProps> = ({
  type,
  duration = 15,
  children,
}) => {
  const frame = useCurrentFrame();

  let opacity = 1;

  if (type === "fadeIn") {
    opacity = interpolate(frame, [0, duration], [0, 1], {
      extrapolateRight: "clamp",
    });
  } else if (type === "fadeOut") {
    opacity = interpolate(frame, [0, duration], [1, 0], {
      extrapolateRight: "clamp",
    });
  }

  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

interface ExitAnimationProps {
  startFrame: number;
  children: React.ReactNode;
}

export const ExitAnimation: React.FC<ExitAnimationProps> = ({
  startFrame,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const exitProgress = spring({
    frame: Math.max(0, frame - startFrame),
    fps,
    config: SPRING_CONFIGS.snappy,
  });

  const scale = interpolate(exitProgress, [0, 1], [1, 0.9]);
  const opacity = 1 - exitProgress;
  const x = exitProgress * width * 0.3;

  return (
    <AbsoluteFill
      style={{
        transform: `translateX(${x}px) scale(${scale})`,
        opacity,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const BlackScreen: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: BRAND.colors.black }} />
);
