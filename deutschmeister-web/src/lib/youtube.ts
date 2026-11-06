/**
 * YouTube link helpers. `parseYouTubeId` mirrors the API's
 * `YoutubeTranscriptService.extractVideoId` so the client accepts exactly the
 * inputs the server does: a bare 11-char id, youtu.be links, and
 * (m./music./www.)youtube(-nocookie).com watch / embed / shorts / live / v.
 */
const ID_RE = /^[A-Za-z0-9_-]{11}$/;
const SHORT_RE = /youtu\.be\/([A-Za-z0-9_-]{11})/;
const FULL_RE =
  /(?:m\.|music\.|www\.)?youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^ ]*&)?v=|embed\/|shorts\/|live\/|v\/)([A-Za-z0-9_-]{11})/;

export function parseYouTubeId(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  if (ID_RE.test(s)) return s;
  return s.match(SHORT_RE)?.[1] ?? s.match(FULL_RE)?.[1] ?? null;
}

/** Canonical watch URL — drops tracking/playlist params (`si`, `list`, `t`, …). */
export function canonicalYouTubeUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

export function youTubeThumbnail(id: string, size: 'mq' | 'hq' = 'mq'): string {
  return `https://img.youtube.com/vi/${id}/${size}default.jpg`;
}
