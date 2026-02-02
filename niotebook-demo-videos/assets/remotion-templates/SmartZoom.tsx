/**
 * niotebook Smart Zoom Component
 *
 * Zooms into a specific area of the video with smooth spring animation.
 * Maintains context by limiting max zoom and centering on target.
 */

import React from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Video,
  staticFile,
} from "remotion";
import { SPRING_CONFIGS, TIMING } from "./brand";

interface SmartZoomProps {
  /** Path to the screen recording */
  videoSrc: string;
  /** Frame when zoom starts */
  zoomInFrame: number;
  /** Frame when zoom out starts (default: zoomInFrame + hold duration) */
  zoomOutFrame?: number;
  /** Target X position (0-1, where 0.5 is center) */
  targetX?: number;
  /** Target Y position (0-1, where 0.5 is center) */
  targetY?: number;
  /** Maximum zoom level (default: 1.5) */
  maxZoom?: number;
}

export const SmartZoom: React.FC<SmartZoomProps> = ({
  videoSrc,
  zoomInFrame,
  zoomOutFrame,
  targetX = 0.5,
  targetY = 0.5,
  maxZoom = 1.5,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const defaultZoomOutFrame = zoomInFrame + TIMING.zoomIn + TIMING.zoomHold;
  const actualZoomOutFrame = zoomOutFrame ?? defaultZoomOutFrame;

  // Zoom in progress
  const zoomInProgress = spring({
    frame: frame - zoomInFrame,
    fps,
    config: SPRING_CONFIGS.focus,
  });

  // Zoom out progress
  const zoomOutProgress = spring({
    frame: frame - actualZoomOutFrame,
    fps,
    config: SPRING_CONFIGS.smooth,
  });

  // Combined zoom: goes from 1 -> maxZoom -> 1
  const zoomIn = interpolate(zoomInProgress, [0, 1], [1, maxZoom]);
  const zoomOut = interpolate(zoomOutProgress, [0, 1], [0, maxZoom - 1]);
  const scale = zoomIn - zoomOut;

  // Calculate translation to center on target
  const translateX = (0.5 - targetX) * width * (scale - 1);
  const translateY = (0.5 - targetY) * height * (scale - 1);

  return (
    <AbsoluteFill>
      <Video
        src={staticFile(videoSrc)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          transform: `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)`,
          transformOrigin: "center center",
        }}
      />
    </AbsoluteFill>
  );
};
