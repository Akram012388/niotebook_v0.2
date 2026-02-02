/**
 * niotebook Workspace Slide Component
 *
 * Slides the workspace UI into frame with spring physics.
 * Supports different entry directions.
 */

import React from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Video,
  staticFile,
} from "remotion";
import { BRAND, SPRING_CONFIGS } from "./brand";

interface WorkspaceSlideProps {
  /** Frame when workspace starts sliding in */
  startFrame?: number;
  /** Path to the screen recording */
  videoSrc: string;
  /** Direction to slide from */
  direction?: "left" | "right" | "bottom" | "top";
  /** Optional exit frame (for sliding out) */
  exitFrame?: number;
}

export const WorkspaceSlide: React.FC<WorkspaceSlideProps> = ({
  startFrame = 0,
  videoSrc,
  direction = "right",
  exitFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Enter animation
  const enterProgress = spring({
    frame: frame - startFrame,
    fps,
    config: SPRING_CONFIGS.smooth,
  });

  // Exit animation (optional)
  const exitProgress = exitFrame
    ? spring({
        frame: frame - exitFrame,
        fps,
        config: SPRING_CONFIGS.snappy,
      })
    : 0;

  // Calculate offset based on direction
  const getOffset = (progress: number) => {
    const distance = direction === "left" || direction === "right" ? width : height;
    const inverse = direction === "left" || direction === "top" ? -1 : 1;
    return distance * inverse * (1 - progress);
  };

  const enterOffset = getOffset(enterProgress);
  const exitOffset = exitFrame ? -getOffset(1 - exitProgress) : 0;

  const transform =
    direction === "left" || direction === "right"
      ? `translateX(${enterOffset + exitOffset}px)`
      : `translateY(${enterOffset + exitOffset}px)`;

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.colors.black }}>
      <AbsoluteFill style={{ transform }}>
        <Video
          src={staticFile(videoSrc)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
