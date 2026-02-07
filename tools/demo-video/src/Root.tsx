import React from "react";
import { Composition } from "remotion";
import { DemoVideo } from "./DemoVideo";
import { Intro } from "./Intro";
import { VIDEO, TIMING } from "./constants";

const DEFAULT_RECORDING_SECONDS = 60;
const RECORDING_FRAMES = DEFAULT_RECORDING_SECONDS * VIDEO.fps;

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
          recordingSrc: "recording.mp4",
          recordingDurationInFrames: RECORDING_FRAMES,
        }}
      />

      {/* Intro-only preview for testing animations */}
      <Composition
        id="IntroPreview"
        component={Intro}
        durationInFrames={TIMING.introTotal + 30}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
      />
    </>
  );
};
