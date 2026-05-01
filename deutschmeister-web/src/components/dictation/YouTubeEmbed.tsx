'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export interface YouTubeEmbedRef {
  seekTo: (seconds: number) => void;
  playSegment: (startSec: number, endSec: number) => void;
  setSpeed: (rate: number) => void;
}

interface Props {
  youtubeId: string;
  onError?: () => void;
  onTimeUpdate?: (currentSec: number) => void;
}

declare global {
  interface Window {
    YT: any;
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
  { youtubeId, onError, onTimeUpdate },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const segmentTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeUpdateTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  onTimeUpdateRef.current = onTimeUpdate;

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
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onError: () => onError?.(),
          onStateChange: (e: any) => {
            // YT.PlayerState.PLAYING = 1
            if (e.data === 1) {
              if (!timeUpdateTimerRef.current) {
                timeUpdateTimerRef.current = setInterval(() => {
                  try {
                    const t = playerRef.current?.getCurrentTime?.();
                    if (t !== undefined) onTimeUpdateRef.current?.(t);
                  } catch {}
                }, 300);
              }
            } else {
              if (timeUpdateTimerRef.current) {
                clearInterval(timeUpdateTimerRef.current);
                timeUpdateTimerRef.current = null;
              }
            }
          },
        },
      });
    });

    return () => {
      destroyed = true;
      if (segmentTimerRef.current) clearInterval(segmentTimerRef.current);
      if (timeUpdateTimerRef.current) clearInterval(timeUpdateTimerRef.current);
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
