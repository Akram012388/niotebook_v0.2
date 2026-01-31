"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import {
  clampVideoTime,
  shouldPersistVideoTime,
  type VideoPlaybackState,
} from "../../domain/video";
import {
  loadYouTubeApi,
  type YouTubePlayerInstance,
  type YouTubePlayerStateEvent,
} from "../../infra/youtubeApi";

type VideoPlayerProps = {
  videoId: string;
  initialTimeSec?: number | null;
  seekToSec?: number | null;
  seekToken?: number;
  onTimeSample?: (timeSec: number) => void;
  onSeek?: (timeSec: number) => void;
  onPlayState?: (state: VideoPlaybackState) => void;
  showControls?: boolean;
};

const SAMPLE_INTERVAL_SEC = 3;

/** Module-level cache so remounts (e.g. layout switch) resume from last position. */
const playbackCache = new Map<
  string,
  { timeSec: number; playing: boolean }
>();

const VideoPlayer = ({
  videoId,
  initialTimeSec = null,
  seekToSec,
  seekToken,
  onTimeSample,
  onSeek,
  onPlayState,
  showControls = true,
}: VideoPlayerProps): ReactElement => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YouTubePlayerInstance | null>(null);
  const resolvedInitialTimeSec = initialTimeSec ?? 0;
  const [currentTimeSec, setCurrentTimeSec] = useState(resolvedInitialTimeSec);
  const lastSampleRef = useRef<number | null>(null);
  const didApplyInitialSeekRef = useRef(false);
  const [playState, setPlayState] = useState<VideoPlaybackState>("paused");
  const playStateRef = useRef<VideoPlaybackState>("paused");
  const [statusMessage, setStatusMessage] = useState<string>(
    "Initializing player...",
  );

  const formattedTime = useMemo((): string => {
    const minutes = Math.floor(currentTimeSec / 60);
    const seconds = Math.floor(currentTimeSec % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [currentTimeSec]);

  const updateCurrentTime = useCallback(
    (nextTime: number): void => {
      const nextSec = clampVideoTime(nextTime);
      setCurrentTimeSec(nextSec);
      if (
        shouldPersistVideoTime({
          currentSec: nextSec,
          lastSampleSec: lastSampleRef.current,
          intervalSec: SAMPLE_INTERVAL_SEC,
        })
      ) {
        lastSampleRef.current = nextSec;
        onTimeSample?.(nextSec);
      }
    },
    [onTimeSample],
  );

  const updateCurrentTimeRef = useRef(updateCurrentTime);
  const onSeekRef = useRef(onSeek);
  const initialTimeRef = useRef<number | null>(initialTimeSec ?? null);

  useEffect(() => {
    updateCurrentTimeRef.current = updateCurrentTime;
  }, [updateCurrentTime]);

  useEffect(() => {
    onSeekRef.current = onSeek;
  }, [onSeek]);

  useEffect(() => {
    initialTimeRef.current =
      initialTimeSec === null || initialTimeSec === undefined
        ? null
        : initialTimeSec;
  }, [initialTimeSec]);

  const applyInitialSeek = useCallback((nextTime: number): void => {
    const player = playerRef.current;
    if (!player || typeof player.seekTo !== "function") {
      return;
    }

    if (didApplyInitialSeekRef.current) {
      return;
    }

    const nextSec = clampVideoTime(nextTime);
    player.seekTo(nextSec, true);
    lastSampleRef.current = null;
    updateCurrentTimeRef.current(nextSec);
    onSeekRef.current?.(nextSec);
    didApplyInitialSeekRef.current = true;
  }, []);

  useEffect((): void => {
    onPlayState?.(playState);
  }, [onPlayState, playState]);

  useEffect(() => {
    let cancelled = false;

    didApplyInitialSeekRef.current = false;

    const setupPlayer = async (): Promise<void> => {
      if (!containerRef.current) {
        return;
      }

      setStatusMessage("Loading YouTube player...");

      try {
        const api = await loadYouTubeApi();

        if (cancelled || !containerRef.current) {
          return;
        }

        const instance = new api.Player(containerRef.current, {
          videoId,
          playerVars: {
            autoplay: 0,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
          },
          events: {
            onReady: (event) => {
              playerRef.current = event.target;
              setStatusMessage("Ready");
              const cached = playbackCache.get(videoId);
              if (cached) {
                playbackCache.delete(videoId);
                didApplyInitialSeekRef.current = true;
                const nextSec = clampVideoTime(cached.timeSec);
                event.target.seekTo(nextSec, true);
                if (cached.playing) {
                  event.target.playVideo();
                }
                lastSampleRef.current = null;
                updateCurrentTimeRef.current(nextSec);
                onSeekRef.current?.(nextSec);
              } else if (typeof initialTimeRef.current === "number") {
                applyInitialSeek(initialTimeRef.current);
              }
            },
            onStateChange: (event: YouTubePlayerStateEvent) => {
              const state = api.PlayerState;
              if (event.data === state.PLAYING) {
                setPlayState("playing");
                playStateRef.current = "playing";
              }
              if (event.data === state.PAUSED) {
                setPlayState("paused");
                playStateRef.current = "paused";
                const nextTime = event.target.getCurrentTime();
                updateCurrentTimeRef.current(nextTime);
                onSeekRef.current?.(nextTime);
                playbackCache.set(videoId, {
                  timeSec: nextTime,
                  playing: false,
                });
              }
              if (event.data === state.ENDED) {
                setPlayState("paused");
                playStateRef.current = "paused";
                const nextTime = event.target.getCurrentTime();
                updateCurrentTimeRef.current(nextTime);
                onSeekRef.current?.(nextTime);
                playbackCache.set(videoId, {
                  timeSec: nextTime,
                  playing: false,
                });
              }
            },
          },
        });

        playerRef.current = instance;
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : "Player failed to load";
          setStatusMessage(message);
        }
      }
    };

    void setupPlayer();

    return () => {
      cancelled = true;
      const player = playerRef.current;
      if (player && typeof player.getCurrentTime === "function") {
        try {
          playbackCache.set(videoId, {
            timeSec: player.getCurrentTime(),
            playing: playStateRef.current === "playing",
          });
        } catch {
          /* player already disposed */
        }
      }
      player?.destroy();
      playerRef.current = null;
    };
  }, [applyInitialSeek, videoId]);

  useEffect(() => {
    if (typeof initialTimeSec === "number") {
      applyInitialSeek(initialTimeSec);
    }
  }, [applyInitialSeek, initialTimeSec]);

  useEffect(() => {
    if (seekToSec === null || seekToSec === undefined) {
      return;
    }

    const player = playerRef.current;
    if (!player || typeof player.seekTo !== "function") {
      return;
    }

    const nextTime = clampVideoTime(seekToSec);
    player.seekTo(nextTime, true);
    lastSampleRef.current = null;
    onSeekRef.current?.(nextTime);
  }, [seekToSec, seekToken]);

  useEffect(() => {
    if (playState !== "playing") {
      return;
    }

    const interval = window.setInterval(() => {
      const player = playerRef.current;
      if (!player || typeof player.getCurrentTime !== "function") {
        return;
      }

      const t = clampVideoTime(player.getCurrentTime());
      updateCurrentTime(t);
      playbackCache.set(videoId, { timeSec: t, playing: true });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [playState, updateCurrentTime, videoId]);

  const handlePlay = useCallback((): void => {
    const player = playerRef.current;
    if (!player || typeof player.playVideo !== "function") {
      return;
    }
    player.playVideo();
    const nextTime =
      typeof player.getCurrentTime === "function"
        ? player.getCurrentTime()
        : currentTimeSec;
    updateCurrentTime(clampVideoTime(nextTime));
  }, [currentTimeSec, updateCurrentTime]);

  const handlePause = useCallback((): void => {
    const player = playerRef.current;
    if (!player || typeof player.pauseVideo !== "function") {
      return;
    }
    player.pauseVideo();
    const nextTime =
      typeof player.getCurrentTime === "function"
        ? player.getCurrentTime()
        : currentTimeSec;
    updateCurrentTime(clampVideoTime(nextTime));
  }, [currentTimeSec, updateCurrentTime]);

  const handleSeekDelta = useCallback(
    (delta: number): void => {
      const player = playerRef.current;
      if (!player || typeof player.getCurrentTime !== "function") {
        return;
      }

      const next = clampVideoTime(player.getCurrentTime() + delta);
      if (typeof player.seekTo === "function") {
        player.seekTo(next, true);
      }
      updateCurrentTime(next);
      onSeek?.(next);
    },
    [onSeek, updateCurrentTime],
  );

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
        <div ref={containerRef} className="h-full w-full" />
        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-center justify-between text-[11px] text-white/80">
          <span>{playState === "playing" ? "Playing" : "Paused"}</span>
          <span>{formattedTime}</span>
        </div>
        <div className="pointer-events-none absolute inset-x-3 bottom-3 text-[11px] text-white/60">
          {statusMessage}
        </div>
      </div>
      {showControls ? (
        <div className="flex items-center justify-between text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePlay}
              className="rounded-full border border-border px-3 py-1"
            >
              Play
            </button>
            <button
              type="button"
              onClick={handlePause}
              className="rounded-full border border-border px-3 py-1"
            >
              Pause
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSeekDelta(-10)}
              className="rounded-full border border-border px-3 py-1"
            >
              -10s
            </button>
            <button
              type="button"
              onClick={() => handleSeekDelta(10)}
              className="rounded-full border border-border px-3 py-1"
            >
              +10s
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export { VideoPlayer };
