import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Wordmark } from "./Wordmark";
import { Tagline } from "./Tagline";
import { BRAND, TIMING } from "./constants";

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();

  const showWordmark =
    frame >= TIMING.wordmark.popStart && frame < TIMING.wordmark.end;
  const showTagline =
    frame >= TIMING.tagline.start && frame < TIMING.tagline.end;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {showWordmark && <Wordmark />}
      {showTagline && <Tagline />}
    </AbsoluteFill>
  );
};
