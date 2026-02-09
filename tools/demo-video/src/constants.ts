// Brand colors — light theme (warm, friendly energy)
export const BRAND = {
  background: "#f4f3ee",
  foreground: "#1c1917",
  accent: "#c15f3c",
  surface: "#faf9f7",
  textMuted: "#78716c",
} as const;

// Video specs — 4K 16:9 @ 60fps (matches Screen Studio Pro export)
export const VIDEO = {
  width: 3840,
  height: 2160,
  fps: 60,
} as const;

// ── Intro timing (frames at 60fps) ─────────────────────────────
// Total intro: ~8.2s (same wall-clock as original 30fps version)
const LEAD_IN = 18; //                          0.3s  warm bg
const WM_POP_START = LEAD_IN; //               frame 18
const WM_POP_DURATION = 72; //                 1.2s
const WM_HOLD = 30; //                         0.5s
const I_BOUNCE_DURATION = 48; //               0.8s
const I_BOUNCE_HOLD = 138; //                  2.3s  (+2s breathing room)
const WM_SNAP_DURATION = 18; //                0.3s

const WM_END =
  WM_POP_START +
  WM_POP_DURATION +
  WM_HOLD +
  I_BOUNCE_DURATION +
  I_BOUNCE_HOLD +
  WM_SNAP_DURATION; // frame 324

const TL_START = WM_END; //                    frame 324
const TL_POP_DURATION = 60; //                 1.0s
const TL_HOLD = 90; //                         1.5s  (+1s breathing room)
const TL_SNAP_DURATION = 18; //                0.3s

const INTRO_TOTAL = TL_START + TL_POP_DURATION + TL_HOLD + TL_SNAP_DURATION; // frame 492 = 8.2s

export const TIMING = {
  leadIn: LEAD_IN,

  wordmark: {
    popStart: WM_POP_START,
    popDuration: WM_POP_DURATION,
    hold: WM_HOLD,
    iBounceDuration: I_BOUNCE_DURATION,
    iBounceHold: I_BOUNCE_HOLD,
    snapDuration: WM_SNAP_DURATION,
    // derived
    iBounceStart: WM_POP_START + WM_POP_DURATION + WM_HOLD, // frame 120
    snapStart:
      WM_POP_START +
      WM_POP_DURATION +
      WM_HOLD +
      I_BOUNCE_DURATION +
      I_BOUNCE_HOLD, // frame 306
    end: WM_END, // frame 324
  },

  tagline: {
    start: TL_START, // frame 324
    popDuration: TL_POP_DURATION,
    hold: TL_HOLD,
    snapDuration: TL_SNAP_DURATION,
    snapStart: TL_START + TL_POP_DURATION + TL_HOLD, // frame 474
    end: INTRO_TOTAL, // frame 492
  },

  introTotal: INTRO_TOTAL,

  outro: {
    fadeDuration: 90, // 1.5s
    holdDuration: 18, //  0.3s (matches leadIn for seamless loop)
  },
} as const;

// ── Wordmark config (2.25x from original for 4K + 1.5x bump) ───
export const WORDMARK_CONFIG = {
  fontSize: 288,
  letterSpacing: 9,
  taglineFontSize: 162,
  taglineGap: 45,
} as const;

// "i" dot geometry — 2.25x from original (4K * 1.5x wordmark bump).
// The mask approach places a bg-colored rect over the original dot, then
// animates a separate dot div independently. Tune offsets in Remotion studio.
export const I_DOT = {
  width: 41, //         dot width (px)
  height: 43, //        dot height (px)
  offsetTop: 34, //     dot top-edge from top of character box (px)
  borderRadius: 3, //   sharp corners to match Orbitron
  maskPadTop: 9, //     extra mask padding above dot
  maskPadBottom: 23, // extra mask padding below dot (covers gap fully)
  maskPadSide: 14, //   extra mask width beyond character edges
} as const;
