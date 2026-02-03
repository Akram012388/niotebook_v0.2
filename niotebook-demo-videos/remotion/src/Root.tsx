import React from "react";
import { Composition } from "remotion";
import { NiotebookDemo } from "./NiotebookDemo";
import { VIDEO_CONFIG } from "./brand";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="NiotebookDemo"
        component={NiotebookDemo}
        durationInFrames={VIDEO_CONFIG.durationInFrames}
        fps={VIDEO_CONFIG.fps}
        width={VIDEO_CONFIG.width}
        height={VIDEO_CONFIG.height}
      />
    </>
  );
};
