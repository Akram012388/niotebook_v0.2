import React from "react";
import { Composition } from "remotion";
import { DemoVideo } from "./DemoVideo";
import { Intro } from "./Intro";
import { VIDEO, TIMING } from "./constants";

// Recording: niotebook-demo-v2-body.mp4 — 3840x2160 @ 60fps, 50.65s
const RECORDING_FRAMES = 3039;

export const RemotionRoot: React.FC = () => {
  const fullDuration =
    TIMING.introTotal + RECORDING_FRAMES + TIMING.outro.holdDuration;

  return (
    <>
      {/* Full video: intro → screen recording → fade-out loop */}
      <Composition
        id="DemoVideo"
        component={DemoVideo}
        durationInFrames={fullDuration}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
        defaultProps={{
          recordingSrc: "niotebook-demo-v2-body.mp4",
          recordingDurationInFrames: RECORDING_FRAMES,
        }}
      />

      {/* Intro-only preview for testing animations */}
      <Composition
        id="IntroPreview"
        component={Intro}
        durationInFrames={TIMING.introTotal + 60}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
      />
    </>
  );
};
