'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export interface YouTubeEmbedRef {
  seekTo: (seconds: number) => void;
  playSegment: (startSec: number, endSec: number) => void;
  setSpeed: (rate: number) => void;
}

export interface AutoPauseSegment {
  id: string;
  /** ms */
  start: number;
  /** ms */
  end: number;
}

interface Props {
  youtubeId: string;
  onError?: () => void;
  onTimeUpdate?: (currentSec: number) => void;
  /**
   * When provided AND non-empty, the player auto-pauses when continuous
   * playback crosses out of a segment (i.e. user reaches end of phrase).
   * Skipped while a `playSegment(...)` call is in flight — that path has
   * its own end-of-segment pause and shouldn't double-fire.
   */
  autoPauseSegments?: ReadonlyArray<AutoPauseSegment>;
  onAutoPaused?: (endedSegmentId: string) => void;
}

interface YTPlayer {
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  playVideo(): void;
  pauseVideo(): void;
  destroy(): void;
  getCurrentTime?(): number;
  getPlayerState?(): number;
  setPlaybackRate(rate: number): void;
}

interface YTPlayerStateEvent {
  data: number;
}

declare global {
  interface Window {
    YT: {
      Player: new (container: HTMLElement, options: {
        videoId: string;
        playerVars?: Record<string, number>;
        events?: {
          onError?: () => void;
          onStateChange?: (e: YTPlayerStateEvent) => void;
        };
      }) => YTPlayer;
    };
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

// Load the YouTube IFrame API script once globally
function loadYTScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  return new Promise(resolve => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    if (!document.getElementById('yt-iframe-api')) {
      const s = document.createElement('script');
      s.id = 'yt-iframe-api';
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    }
  });
}

export const YouTubeEmbed = forwardRef<YouTubeEmbedRef, Props>(function YouTubeEmbed(
  { youtubeId, onError, onTimeUpdate, autoPauseSegments, onAutoPaused },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const segmentTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeUpdateTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  onTimeUpdateRef.current = onTimeUpdate;
  const autoPauseSegmentsRef = useRef(autoPauseSegments);
  autoPauseSegmentsRef.current = autoPauseSegments;
  const onAutoPausedRef = useRef(onAutoPaused);
  onAutoPausedRef.current = onAutoPaused;
  const lastActiveSegIdRef = useRef<string | null>(null);
  // The segment we most recently auto-paused at — prevents re-pausing the same
  // boundary when the user resumes playback.
  const lastPausedSegIdRef = useRef<string | null>(null);

  useImperativeHandle(ref, () => ({
    seekTo(seconds: number) {
      try {
        playerRef.current?.seekTo(seconds, true);
        playerRef.current?.playVideo();
      } catch {}
    },
    playSegment(startSec: number, endSec: number) {
      try {
        if (segmentTimerRef.current) clearInterval(segmentTimerRef.current);
        // Reset boundary tracking so continuous auto-pause restarts cleanly
        // after this explicit single-segment playback.
        lastActiveSegIdRef.current = null;
        lastPausedSegIdRef.current = null;
        playerRef.current?.seekTo(startSec, true);
        playerRef.current?.playVideo();
        segmentTimerRef.current = setInterval(() => {
          try {
            const current = playerRef.current?.getCurrentTime?.() ?? 0;
            if (current >= endSec) {
              playerRef.current?.pauseVideo();
              if (segmentTimerRef.current) clearInterval(segmentTimerRef.current);
              segmentTimerRef.current = null;
            }
          } catch {}
        }, 250);
      } catch {}
    },
    setSpeed(rate: number) {
      try {
        playerRef.current?.setPlaybackRate(rate);
      } catch {}
    },
  }));

  useEffect(() => {
    let destroyed = false;

    loadYTScript().then(() => {
      if (destroyed || !containerRef.current) return;

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: youtubeId,
        playerVars: { rel: 0, modestbranding: 1, enablejsapi: 1 },
        events: {
          onError: () => onError?.(),
          onStateChange: (e: YTPlayerStateEvent) => {
            // A user pause / video end must cancel any in-flight playSegment
            // timer. Skip BUFFERING (3) so a transient buffer blip mid-segment
            // doesn't cancel a valid playSegment.
            if (e.data === 2 || e.data === 0) {
              if (segmentTimerRef.current) {
                clearInterval(segmentTimerRef.current);
                segmentTimerRef.current = null;
              }
              // Forget the last active segment so resuming from a pause does
              // not immediately re-pause the boundary we just stopped at.
              lastActiveSegIdRef.current = null;
            }
          },
        },
      });

      // ONE persistent monitor, independent of onStateChange (which is
      // unreliable for interval lifecycle — buffering tears it down and a
      // missed PLAYING event never rebuilds it). It self-gates on the live
      // player state, so it survives buffering and native-control playback.
      if (!timeUpdateTimerRef.current) {
        timeUpdateTimerRef.current = setInterval(() => {
          try {
            const player = playerRef.current;
            if (!player) return;
            // YT.PlayerState.PLAYING === 1
            if (player.getPlayerState?.() !== 1) return;
            const t = player.getCurrentTime?.();
            if (t === undefined) return;
            onTimeUpdateRef.current?.(t);

            const segs = autoPauseSegmentsRef.current;
            if (segs?.length) {
              const ms = t * 1000;
              const active = segs.find(s => ms >= s.start && ms <= s.end);
              const newId = active?.id ?? null;
              const prevId = lastActiveSegIdRef.current;
              // Pause once when we cross OUT of a segment during continuous
              // playback (the sentence just finished). Guarded by lastPausedSegId
              // so resuming from that pause doesn't immediately re-pause the same
              // boundary.
              if (
                prevId !== null &&
                newId !== prevId &&
                lastPausedSegIdRef.current !== prevId
              ) {
                try { player.pauseVideo(); } catch {}
                lastPausedSegIdRef.current = prevId;
                onAutoPausedRef.current?.(prevId);
              }
              lastActiveSegIdRef.current = newId;
            }
          } catch {}
        }, 250);
      }
    });

    return () => {
      destroyed = true;
      if (segmentTimerRef.current) { clearInterval(segmentTimerRef.current); segmentTimerRef.current = null; }
      if (timeUpdateTimerRef.current) { clearInterval(timeUpdateTimerRef.current); timeUpdateTimerRef.current = null; }
      lastActiveSegIdRef.current = null;
      lastPausedSegIdRef.current = null;
      try { playerRef.current?.destroy(); } catch {}
      playerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youtubeId]);

  return (
    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '16px' }}>
      <div
        ref={containerRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      />
    </div>
  );
});
