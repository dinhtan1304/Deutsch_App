'use client';

import { useEffect, useRef, useState } from 'react';
import { translateText } from '@/lib/api/translation';
import type { TranscriptSegment } from '@/lib/api/dictation';

// gtx is a GET endpoint — keep the encoded query well under URL limits.
const MAX_BATCH_CHARS = 1200;
const BATCH_GAP_MS = 250;
const RETRY_AFTER_MS = 30_000;
const STORAGE_PREFIX = 'dm-vi-subs:';

function readCache(videoId: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + videoId);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeCache(videoId: string, map: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_PREFIX + videoId, JSON.stringify(map));
  } catch {}
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/**
 * Vietnamese line for each transcript segment, translated client-side via the
 * free Google gtx endpoint. Batches several segments per request (joined by
 * newlines), starts at the segment being watched and works forward, and caches
 * per video in localStorage. Failures only hide the VI line — never throw.
 */
export function useSegmentTranslations(
  videoId: string,
  segments: TranscriptSegment[],
  currentIndex: number,
  enabled: boolean,
): Record<string, string> {
  const [map, setMap] = useState<Record<string, string>>({});
  const mapRef = useRef(map);
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;
  const runningRef = useRef(false);
  const failedAtRef = useRef(0);
  // Bumped to (re)start the loop: after a failure cooldown, or when the user
  // seeks into a region the finished loop skipped.
  const [kick, setKick] = useState(0);

  useEffect(() => {
    const cached = videoId ? readCache(videoId) : {};
    mapRef.current = cached;
    setMap(cached);
  }, [videoId]);

  useEffect(() => {
    if (runningRef.current || !enabled) return;
    const seg = segments[currentIndex];
    if (!seg || mapRef.current[seg.id] !== undefined) return;
    if (Date.now() - failedAtRef.current < RETRY_AFTER_MS) return;
    setKick(k => k + 1);
  }, [currentIndex, segments, enabled]);

  useEffect(() => {
    if (!enabled || !videoId || !segments.length) return;
    let cancelled = false;
    runningRef.current = true;

    // Next batch of untranslated segments, starting from the one on screen
    // and wrapping around so the whole video is eventually covered.
    const nextBatch = (): TranscriptSegment[] => {
      const start = Math.max(0, currentIndexRef.current);
      const batch: TranscriptSegment[] = [];
      let chars = 0;
      for (let k = 0; k < segments.length; k++) {
        const seg = segments[(start + k) % segments.length]!;
        if (mapRef.current[seg.id] !== undefined) {
          if (batch.length) break; // keep batches contiguous
          continue;
        }
        if (batch.length && chars + seg.text.length > MAX_BATCH_CHARS) break;
        batch.push(seg);
        chars += seg.text.length + 1;
      }
      return batch;
    };

    (async () => {
      try {
        for (let batch = nextBatch(); batch.length && !cancelled; batch = nextBatch()) {
          const lines = await translateBatch(batch);
          if (cancelled) return;
          const next = { ...mapRef.current };
          batch.forEach((seg, i) => { next[seg.id] = lines[i] ?? ''; });
          mapRef.current = next;
          setMap(next);
          writeCache(videoId, next);
          await sleep(BATCH_GAP_MS);
        }
      } catch {
        failedAtRef.current = Date.now();
      } finally {
        if (!cancelled) runningRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
      runningRef.current = false;
    };
  }, [enabled, videoId, segments, kick]);

  return map;
}

async function translateBatch(batch: TranscriptSegment[]): Promise<string[]> {
  if (batch.length === 1) return [await translateText(batch[0]!.text, 'de', 'vi')];
  const joined = await translateText(batch.map(s => s.text.replace(/\n/g, ' ')).join('\n'), 'de', 'vi');
  const lines = joined.split('\n').map(l => l.trim());
  if (lines.length === batch.length) return lines;
  // Line count drifted (gtx merged or split a sentence) — fall back to one-by-one.
  const out: string[] = [];
  for (const seg of batch) {
    out.push(await translateText(seg.text, 'de', 'vi'));
    await sleep(BATCH_GAP_MS);
  }
  return out;
}
