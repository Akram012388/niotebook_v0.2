// Brand colors — light theme (warm, friendly energy)
export const BRAND = {
  background: "#f4f3ee",
  foreground: "#1c1917",
  accent: "#c15f3c",
  surface: "#faf9f7",
  textMuted: "#78716c",
} as const;

// Video specs
export const VIDEO = {
  width: 2560,
  height: 1440,
  fps: 30,
} as const;

// ── Intro timing (frames at 30fps) ─────────────────────────────
// Total intro: ~8.2s
const LEAD_IN = 9; //                          0.3s  warm bg
const WM_POP_START = LEAD_IN; //               frame 9
const WM_POP_DURATION = 36; //                 1.2s
const WM_HOLD = 15; //                         0.5s
const I_BOUNCE_DURATION = 24; //               0.8s
const I_BOUNCE_HOLD = 69; //                   2.3s  (+2s breathing room)
const WM_SNAP_DURATION = 9; //                 0.3s

const WM_END =
  WM_POP_START +
  WM_POP_DURATION +
  WM_HOLD +
  I_BOUNCE_DURATION +
  I_BOUNCE_HOLD +
  WM_SNAP_DURATION; // frame 162

const TL_START = WM_END; //                    frame 162
const TL_POP_DURATION = 30; //                 1.0s
const TL_HOLD = 45; //                         1.5s  (+1s breathing room)
const TL_SNAP_DURATION = 9; //                 0.3s

const INTRO_TOTAL =
  TL_START + TL_POP_DURATION + TL_HOLD + TL_SNAP_DURATION; // frame 246 = 8.2s

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
    iBounceStart: WM_POP_START + WM_POP_DURATION + WM_HOLD, // frame 60
    snapStart:
      WM_POP_START +
      WM_POP_DURATION +
      WM_HOLD +
      I_BOUNCE_DURATION +
      I_BOUNCE_HOLD, // frame 153
    end: WM_END, // frame 162
  },

  tagline: {
    start: TL_START, // frame 162
    popDuration: TL_POP_DURATION,
    hold: TL_HOLD,
    snapDuration: TL_SNAP_DURATION,
    snapStart: TL_START + TL_POP_DURATION + TL_HOLD, // frame 237
    end: INTRO_TOTAL, // frame 246
  },

  introTotal: INTRO_TOTAL,

  outro: {
    fadeDuration: 45, // 1.5s
    holdDuration: 9, //  0.3s (matches leadIn for seamless loop)
  },
} as const;

// ── Wordmark config ─────────────────────────────────────────────
export const WORDMARK_CONFIG = {
  fontSize: 128,
  letterSpacing: 4,
  taglineFontSize: 72,
  taglineGap: 20,
} as const;

// "i" dot geometry — measured from rendered Orbitron Bold at fontSize 128, lineHeight 1.2.
// The mask approach places a bg-colored rect over the original dot, then
// animates a separate dot div independently. Tune offsets in Remotion studio.
export const I_DOT = {
  width: 18, //         dot width (px) — pixel-measured from rendered frame
  height: 19, //        dot height (px) — pixel-measured from rendered frame
  offsetTop: 15, //     dot top-edge from top of character box (px)
  borderRadius: 1, //   sharp corners to match Orbitron
  maskPadTop: 4, //     extra mask padding above dot
  maskPadBottom: 10, // extra mask padding below dot (covers 6px gap fully)
  maskPadSide: 6, //    extra mask width beyond character edges
} as const;
