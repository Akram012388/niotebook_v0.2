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
  const lastInitialSeekRef = useRef<number | null>(null);
  const [playState, setPlayState] = useState<VideoPlaybackState>("paused");
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
  const initialTimeRef = useRef(resolvedInitialTimeSec);

  useEffect(() => {
    updateCurrentTimeRef.current = updateCurrentTime;
  }, [updateCurrentTime]);

  useEffect(() => {
    onSeekRef.current = onSeek;
  }, [onSeek]);

  useEffect(() => {
    initialTimeRef.current = resolvedInitialTimeSec;
  }, [resolvedInitialTimeSec]);

  const applyInitialSeek = useCallback((nextTime: number): void => {
    if (!playerRef.current) {
      return;
    }

    const nextSec = clampVideoTime(nextTime);
    if (lastInitialSeekRef.current === nextSec) {
      return;
    }

    lastInitialSeekRef.current = nextSec;
    playerRef.current.seekTo(nextSec, true);
    lastSampleRef.current = null;
    updateCurrentTimeRef.current(nextSec);
    onSeekRef.current?.(nextSec);
  }, []);

  useEffect((): void => {
    onPlayState?.(playState);
  }, [onPlayState, playState]);

  useEffect(() => {
    let cancelled = false;

    lastInitialSeekRef.current = null;

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
              applyInitialSeek(initialTimeRef.current);
            },
            onStateChange: (event: YouTubePlayerStateEvent) => {
              const state = api.PlayerState;
              if (event.data === state.PLAYING) {
                setPlayState("playing");
              }
              if (event.data === state.PAUSED) {
                setPlayState("paused");
                const nextTime = event.target.getCurrentTime();
                updateCurrentTimeRef.current(nextTime);
                onSeekRef.current?.(nextTime);
              }
              if (event.data === state.ENDED) {
                setPlayState("paused");
                const nextTime = event.target.getCurrentTime();
                updateCurrentTimeRef.current(nextTime);
                onSeekRef.current?.(nextTime);
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
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [applyInitialSeek, videoId]);

  useEffect(() => {
    if (initialTimeSec === null || initialTimeSec === undefined) {
      return;
    }

    applyInitialSeek(initialTimeSec);
  }, [applyInitialSeek, initialTimeSec]);

  useEffect(() => {
    if (seekToSec === null || seekToSec === undefined) {
      return;
    }

    if (!playerRef.current) {
      return;
    }

    const nextTime = clampVideoTime(seekToSec);
    playerRef.current.seekTo(nextTime, true);
    lastSampleRef.current = null;
    onSeekRef.current?.(nextTime);
  }, [seekToSec, seekToken]);

  useEffect(() => {
    if (playState !== "playing") {
      return;
    }

    const interval = window.setInterval(() => {
      const player = playerRef.current;
      if (!player) {
        return;
      }

      updateCurrentTime(clampVideoTime(player.getCurrentTime()));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [playState, updateCurrentTime]);

  const handlePlay = useCallback((): void => {
    playerRef.current?.playVideo();
    const nextTime = playerRef.current?.getCurrentTime() ?? currentTimeSec;
    updateCurrentTime(clampVideoTime(nextTime));
  }, [currentTimeSec, updateCurrentTime]);

  const handlePause = useCallback((): void => {
    playerRef.current?.pauseVideo();
    const nextTime = playerRef.current?.getCurrentTime() ?? currentTimeSec;
    updateCurrentTime(clampVideoTime(nextTime));
  }, [currentTimeSec, updateCurrentTime]);

  const handleSeekDelta = useCallback(
    (delta: number): void => {
      const player = playerRef.current;
      if (!player) {
        return;
      }

      const next = clampVideoTime(player.getCurrentTime() + delta);
      player.seekTo(next, true);
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
