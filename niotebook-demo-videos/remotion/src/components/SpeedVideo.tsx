import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { SPRING_CONFIGS } from "../brand";

interface SpeedVideoProps {
  src: string;
  playbackRate?: number;
  startFrom?: number;
  endAt?: number;
  slideFrom?: "left" | "right" | "bottom" | "top" | "none";
  slideDelay?: number;
  zoom?: {
    startFrame: number;
    endFrame: number;
    targetX: number; // 0-1
    targetY: number; // 0-1
    scale: number;
  };
  opacity?: number;
}

export const SpeedVideo: React.FC<SpeedVideoProps> = ({
  src,
  playbackRate = 1,
  startFrom = 0,
  endAt,
  slideFrom = "none",
  slideDelay = 0,
  zoom,
  opacity = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Slide-in animation
  let slideTransform = "";
  if (slideFrom !== "none") {
    const slideProgress = spring({
      frame: Math.max(0, frame - slideDelay),
      fps,
      config: SPRING_CONFIGS.smooth,
    });

    const slideAmount =
      slideFrom === "left" || slideFrom === "right" ? width : height;
    const direction = slideFrom === "left" || slideFrom === "top" ? -1 : 1;
    const offset = (1 - slideProgress) * slideAmount * direction;

    slideTransform =
      slideFrom === "left" || slideFrom === "right"
        ? `translateX(${offset}px)`
        : `translateY(${offset}px)`;
  }

  // Zoom animation
  let zoomTransform = "";
  if (zoom) {
    const zoomInProgress = spring({
      frame: Math.max(0, frame - zoom.startFrame),
      fps,
      config: SPRING_CONFIGS.focus,
    });

    const zoomOutProgress = spring({
      frame: Math.max(0, frame - zoom.endFrame),
      fps,
      config: SPRING_CONFIGS.smooth,
    });

    const currentScale = interpolate(
      zoomInProgress - zoomOutProgress,
      [0, 1],
      [1, zoom.scale],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    );

    const offsetX = (0.5 - zoom.targetX) * width * (currentScale - 1);
    const offsetY = (0.5 - zoom.targetY) * height * (currentScale - 1);

    zoomTransform = `scale(${currentScale}) translate(${offsetX / currentScale}px, ${offsetY / currentScale}px)`;
  }

  const combinedTransform = [slideTransform, zoomTransform]
    .filter(Boolean)
    .join(" ");

  return (
    <AbsoluteFill style={{ opacity }}>
      <AbsoluteFill
        style={{
          transform: combinedTransform || undefined,
          transformOrigin: "center center",
        }}
      >
        <OffthreadVideo
          src={staticFile(src)}
          playbackRate={playbackRate}
          startFrom={startFrom}
          endAt={endAt}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
