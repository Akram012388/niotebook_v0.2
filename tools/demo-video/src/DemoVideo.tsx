/**
 * Niotebook Landing Page Demo Video
 *
 * 1. Record workspace walkthrough in Screen Studio Pro (2560x1440)
 * 2. Export as .mp4 → place in public/recording.mp4
 * 3. Run `bun run studio` to preview
 * 4. Tweak timing in constants.ts
 * 5. Run `bun run render` to export final video
 */
import React from "react";
import {
  AbsoluteFill,
  Sequence,
  OffthreadVideo,
  staticFile,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { Intro } from "./Intro";
import { BRAND, TIMING } from "./constants";

type Props = {
  recordingSrc: string;
  recordingDurationInFrames: number;
};

export const DemoVideo: React.FC<Props> = ({
  recordingSrc,
  recordingDurationInFrames,
}) => {
  const frame = useCurrentFrame();

  const recordingStart = TIMING.introTotal;
  const outroFadeStart =
    recordingStart + recordingDurationInFrames - TIMING.outro.fadeDuration;

  // Outro: warm background fades in over the last 1.5s of the recording
  const outroOpacity =
    frame >= outroFadeStart
      ? interpolate(
          frame,
          [outroFadeStart, outroFadeStart + TIMING.outro.fadeDuration],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        )
      : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.background }}>
      {/* Intro sequence */}
      <Sequence durationInFrames={TIMING.introTotal}>
        <Intro />
      </Sequence>

      {/* Screen recording */}
      <Sequence
        from={recordingStart}
        durationInFrames={recordingDurationInFrames}
      >
        <AbsoluteFill>
          <OffthreadVideo
            src={staticFile(recordingSrc)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Outro fade overlay → loops back to warm bg */}
      {frame >= outroFadeStart && (
        <AbsoluteFill
          style={{ backgroundColor: BRAND.background, opacity: outroOpacity }}
        />
      )}
    </AbsoluteFill>
  );
};
