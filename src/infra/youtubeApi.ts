const YOUTUBE_IFRAME_API_SRC = "https://www.youtube.com/iframe_api";

type YouTubePlayerState = {
  UNSTARTED: number;
  ENDED: number;
  PLAYING: number;
  PAUSED: number;
  BUFFERING: number;
  CUED: number;
};

type YouTubePlayerInstance = {
  destroy: () => void;
  getCurrentTime: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  playVideo: () => void;
  pauseVideo: () => void;
};

type YouTubePlayerReadyEvent = {
  target: YouTubePlayerInstance;
};

type YouTubePlayerStateEvent = {
  data: number;
  target: YouTubePlayerInstance;
};

type YouTubePlayerOptions = {
  videoId: string;
  playerVars?: Record<string, number | string>;
  events?: {
    onReady?: (event: YouTubePlayerReadyEvent) => void;
    onStateChange?: (event: YouTubePlayerStateEvent) => void;
  };
};

type YouTubePlayerConstructor = new (
  element: HTMLElement,
  options: YouTubePlayerOptions,
) => YouTubePlayerInstance;

type YouTubeApi = {
  Player: YouTubePlayerConstructor;
  PlayerState: YouTubePlayerState;
};

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const isYouTubeApi = (value: unknown): value is YouTubeApi => {
  if (!isRecord(value)) {
    return false;
  }

  const player = value.Player;
  const playerState = value.PlayerState;

  return typeof player === "function" && isRecord(playerState);
};

let youTubeApiPromise: Promise<YouTubeApi> | null = null;

const loadYouTubeApi = (): Promise<YouTubeApi> => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new Error("YouTube API is browser-only."));
  }

  if (isYouTubeApi(window.YT)) {
    return Promise.resolve(window.YT);
  }

  if (youTubeApiPromise) {
    return youTubeApiPromise;
  }

  youTubeApiPromise = new Promise((resolve, reject) => {
    const handleReady = (): void => {
      if (isYouTubeApi(window.YT)) {
        resolve(window.YT);
        return;
      }

      reject(new Error("YouTube API did not load."));
    };

    const existingScript = document.querySelector(
      `script[src="${YOUTUBE_IFRAME_API_SRC}"]`,
    );

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = YOUTUBE_IFRAME_API_SRC;
      script.async = true;
      script.onerror = () => {
        reject(new Error("Failed to load YouTube IFrame API."));
      };
      document.head.appendChild(script);
    }

    if (window.onYouTubeIframeAPIReady) {
      const previousHandler = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previousHandler();
        handleReady();
      };
    } else {
      window.onYouTubeIframeAPIReady = handleReady;
    }

    if (existingScript && isYouTubeApi(window.YT)) {
      handleReady();
    }
  });

  return youTubeApiPromise;
};

export type {
  YouTubeApi,
  YouTubePlayerConstructor,
  YouTubePlayerInstance,
  YouTubePlayerOptions,
  YouTubePlayerReadyEvent,
  YouTubePlayerState,
  YouTubePlayerStateEvent,
};
export { loadYouTubeApi };
