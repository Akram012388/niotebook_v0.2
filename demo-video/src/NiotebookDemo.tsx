import React from "react";
import { AbsoluteFill, Sequence, Audio, staticFile } from "remotion";
import { LogoReveal } from "./components/LogoReveal";
import { SpeedVideo } from "./components/SpeedVideo";
import { BlackScreen, ExitAnimation } from "./components/Transition";
import { BRAND } from "./brand";

/**
 * niotebook Demo Video - 30 seconds, seamless loop
 *
 * Sequence Plan (at 60fps):
 * 0:00-0:02 (0-120)     Logo reveal + ping SFX
 * 0:02-0:04 (120-240)   Workspace slides in (1-pane video) + whoosh SFX
 * 0:04-0:09 (240-540)   Layout transitions (1→2→3 pane montage) + click SFX
 * 0:09-0:13 (540-780)   Zoom: Code execution + success SFX
 * 0:13-0:21 (780-1260)  Hero: AI chat streaming + typing SFX
 * 0:21-0:24 (1260-1440) Full workspace glory shot
 * 0:24-0:28 (1440-1680) Layout dance quick cuts + click SFX
 * 0:28-0:30 (1680-1800) Exit → loop back + ping SFX
 */

export const NiotebookDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.colors.black }}>
      {/* ============ AUDIO LAYER ============ */}

      {/* Logo ping */}
      <Sequence from={25}>
        <Audio src={staticFile("sfx/ping.wav")} volume={0.7} />
      </Sequence>

      {/* Workspace entry whoosh */}
      <Sequence from={108}>
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.4} />
      </Sequence>

      {/* Layout 1→2 click */}
      <Sequence from={260}>
        <Audio src={staticFile("sfx/click.wav")} volume={0.6} />
      </Sequence>

      {/* Layout 2→3 click */}
      <Sequence from={380}>
        <Audio src={staticFile("sfx/click.wav")} volume={0.6} />
      </Sequence>

      {/* Code execution success */}
      <Sequence from={700}>
        <Audio src={staticFile("sfx/success.wav")} volume={0.5} />
      </Sequence>

      {/* AI chat typing ambience (multiple soft clicks) */}
      <Sequence from={850}>
        <Audio src={staticFile("sfx/typing.wav")} volume={0.3} />
      </Sequence>
      <Sequence from={880}>
        <Audio src={staticFile("sfx/typing.wav")} volume={0.3} />
      </Sequence>
      <Sequence from={920}>
        <Audio src={staticFile("sfx/typing.wav")} volume={0.3} />
      </Sequence>
      <Sequence from={960}>
        <Audio src={staticFile("sfx/typing.wav")} volume={0.3} />
      </Sequence>

      {/* AI response complete ping */}
      <Sequence from={1150}>
        <Audio src={staticFile("sfx/success.wav")} volume={0.4} />
      </Sequence>

      {/* Layout dance clicks */}
      <Sequence from={1480}>
        <Audio src={staticFile("sfx/click.wav")} volume={0.5} />
      </Sequence>
      <Sequence from={1540}>
        <Audio src={staticFile("sfx/click.wav")} volume={0.5} />
      </Sequence>
      <Sequence from={1600}>
        <Audio src={staticFile("sfx/click.wav")} volume={0.5} />
      </Sequence>

      {/* Final exit ping (sets up loop) */}
      <Sequence from={1720}>
        <Audio src={staticFile("sfx/ping.wav")} volume={0.5} />
      </Sequence>

      {/* ============ VIDEO LAYER ============ */}

      {/* Scene 1: Logo Reveal (0:00-0:02) */}
      <Sequence from={0} durationInFrames={130}>
        <LogoReveal enterDuration={30} holdDuration={50} exitDuration={30} />
      </Sequence>

      {/* Scene 2: Workspace Entry - 1-pane video (0:01.8-0:04) */}
      <Sequence from={108} durationInFrames={144}>
        <SpeedVideo
          src="recordings/1-pane-video.mp4"
          playbackRate={1.5}
          slideFrom="right"
          slideDelay={0}
          startFrom={60}
        />
      </Sequence>

      {/* Scene 3: Layout 1→2 pane transition (0:04-0:06) */}
      <Sequence from={240} durationInFrames={120}>
        <SpeedVideo
          src="recordings/layout-1to2.mp4"
          playbackRate={2}
          startFrom={0}
        />
      </Sequence>

      {/* Scene 4: Layout 2→3 pane transition (0:06-0:09) */}
      <Sequence from={360} durationInFrames={180}>
        <SpeedVideo
          src="recordings/layout-2to3.mp4"
          playbackRate={2}
          startFrom={0}
        />
      </Sequence>

      {/* Scene 5: Code Execution Focus (0:09-0:13) */}
      <Sequence from={540} durationInFrames={240}>
        <SpeedVideo
          src="recordings/code-execution.mp4"
          playbackRate={1.5}
          startFrom={0}
          zoom={{
            startFrame: 30,
            endFrame: 180,
            targetX: 0.5,
            targetY: 0.4,
            scale: 1.4,
          }}
        />
      </Sequence>

      {/* Scene 6: AI Chat Hero Moment (0:13-0:21) */}
      <Sequence from={780} durationInFrames={480}>
        <SpeedVideo
          src="recordings/ai-chat.mp4"
          playbackRate={2.5}
          startFrom={0}
          zoom={{
            startFrame: 60,
            endFrame: 360,
            targetX: 0.75,
            targetY: 0.5,
            scale: 1.3,
          }}
        />
      </Sequence>

      {/* Scene 7: Full Workspace Glory (0:21-0:24) */}
      <Sequence from={1260} durationInFrames={180}>
        <SpeedVideo
          src="recordings/full-workspace.mp4"
          playbackRate={1.5}
          startFrom={0}
        />
      </Sequence>

      {/* Scene 8: Layout Dance - Quick Cuts (0:24-0:28) */}
      <Sequence from={1440} durationInFrames={240}>
        <SpeedVideo
          src="recordings/layout-dance.mp4"
          playbackRate={2}
          startFrom={0}
        />
      </Sequence>

      {/* Scene 9: Exit Animation → Loop (0:28-0:30) */}
      <Sequence from={1680} durationInFrames={120}>
        <ExitAnimation startFrame={0}>
          <SpeedVideo
            src="recordings/layout-dance.mp4"
            playbackRate={1}
            startFrom={600}
          />
        </ExitAnimation>
      </Sequence>

      {/* Black screen at the very end for clean loop */}
      <Sequence from={1770} durationInFrames={30}>
        <BlackScreen />
      </Sequence>
    </AbsoluteFill>
  );
};
