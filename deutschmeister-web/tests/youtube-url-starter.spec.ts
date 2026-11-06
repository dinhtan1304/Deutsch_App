import { test, expect, type Page, type Route } from '@playwright/test';
import { APP_RELEASE } from '../src/config/release';

/**
 * Paste-a-YouTube-link starter on Dictation + Shadowing (YouTubeUrlStarter).
 * The API is mocked: preview + start responses are scripted per test.
 */
const ID = 'dQw4w9WgXcQ';
const CANONICAL = `https://www.youtube.com/watch?v=${ID}`;

type Handler = (route: Route, url: URL) => unknown | Promise<unknown>;

async function mockApi(page: Page, handlers: Record<string, Handler>) {
  await page.addInitScript((release) => {
    localStorage.setItem('dm_session_hint', '1');
    localStorage.setItem(`dm:release-seen:${release}`, 'seen');
  }, APP_RELEASE.id);
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    for (const [suffix, handler] of Object.entries(handlers)) {
      if (url.pathname.endsWith(suffix)) {
        const res = await handler(route, url);
        if (res === undefined) return; // handler fulfilled itself
        return route.fulfill({ status: 200, json: res });
      }
    }
    const p = url.pathname;
    if (p.endsWith('/auth/refresh')) return route.fulfill({ json: { accessToken: 'browser-test-token' } });
    if (p.endsWith('/auth/bootstrap')) return route.fulfill({ json: {
      user: { id: 'test-learner', email: 'test@example.test', name: 'Learner', avatar: null, role: 'user', emailVerified: true, onboardingCompleted: true, createdAt: new Date().toISOString() },
      settings: {}, subscription: { plan: 'free', status: 'active', expiresAt: null }, unreadCount: { count: 0 },
      xp: { xp: 0, level: 1, name: 'Starter', nameVi: 'Starter', progress: 0 }, streak: 0,
    } });
    if (p.endsWith('/history')) return route.fulfill({ json: { items: [], total: 0, page: 1, limit: 10, totalPages: 0 } });
    if (p.endsWith('/stats')) return route.fulfill({ json: { total: 0, avgScore: 0, bestScore: 0 } });
    if (p.endsWith('/my-requests')) return route.fulfill({ json: { items: [] } });
    return route.fulfill({ status: 503, json: { message: 'Unused test endpoint' } });
  });
}

const preview = (over: Record<string, unknown> = {}) => ({
  youtubeId: ID, title: 'Nicos Weg – Folge 1', channelName: 'DW Deutsch lernen',
  thumbnailUrl: `https://img.youtube.com/vi/${ID}/mqdefault.jpg`,
  inLibrary: false, unavailable: false, knownFailure: null, video: null, ...over,
});

test('dictation: library hit previews, sends a canonical URL once, then navigates', async ({ page }) => {
  const previewUrls: string[] = [];
  const starts: unknown[] = [];
  await mockApi(page, {
    '/dictation/url-preview': (_r, url) => {
      previewUrls.push(url.searchParams.get('url') ?? '');
      return preview({ inLibrary: true, video: { id: 'v1', cefrLevel: 'A2', durationSec: 245, transcriptSource: 'youtube', isActive: true } });
    },
    '/dictation/start-from-url': async (route) => {
      starts.push(route.request().postDataJSON());
      await new Promise((r) => setTimeout(r, 600)); // keep it pending across the 2nd Enter
      return { id: 'sess-1', status: 'DRAFT' };
    },
  });
  await page.goto('/vi/practice-test/dictation');

  // B2 is gone from the starter (the API only accepts A1–B1).
  const starter = page.locator('section').filter({ has: page.getByLabel('Link YouTube') });
  await expect(starter.getByRole('button', { name: 'B2', exact: true })).toHaveCount(0);

  const input = page.getByLabel('Link YouTube');
  await input.fill('https://vimeo.com/123');
  await expect(page.getByText('Đây chưa phải link YouTube hợp lệ.')).toBeVisible();

  await input.fill(`https://youtu.be/${ID}?si=tracking123`);
  await expect(page.getByText('Nicos Weg – Folge 1')).toBeVisible();
  await expect(page.getByText('Có sẵn trong thư viện · bắt đầu ngay')).toBeVisible();
  await expect(page.getByText('4:05')).toBeVisible();
  expect(previewUrls).toEqual([CANONICAL]);

  await input.press('Enter');
  await input.press('Enter');
  await page.waitForURL(/\/practice-test\/dictation\/sess-1$/);
  expect(starts).toEqual([{ youtubeUrl: CANONICAL }]);
});

test('dictation: API error codes are translated (en)', async ({ page }) => {
  await mockApi(page, {
    '/dictation/url-preview': () => preview(),
    '/dictation/start-from-url': (route) => route.fulfill({
      status: 422, json: { statusCode: 422, code: 'NO_GERMAN_CC', message: 'Video này không có phụ đề tiếng Đức.' },
    }).then(() => undefined),
  });
  await page.goto('/en/practice-test/dictation');
  await page.getByLabel('YouTube link').fill(ID);
  await expect(page.getByText('German captions will be fetched from YouTube')).toBeVisible();
  await page.getByRole('button', { name: /^Start/ }).first().click();
  await expect(page.locator('p[role="alert"]')).toHaveText('This video has no German captions. Pick another one.');
});

test('shadowing: missing captions do not block, unavailable videos do, 429 is translated', async ({ page }) => {
  let mode: 'knownFailure' | 'unavailable' = 'knownFailure';
  await mockApi(page, {
    '/dictation/url-preview': () => mode === 'knownFailure'
      ? preview({ knownFailure: 'NO_GERMAN_CC' })
      : preview({ youtubeId: 'privateVid1', title: null, channelName: null, unavailable: true }),
    '/shadowing/start-from-url': (route) => route.fulfill({ status: 429, json: { message: 'ThrottlerException' } }).then(() => undefined),
  });
  await page.goto('/en/practice-test/dictation/shadow');
  const input = page.getByLabel('YouTube link');
  const start = page.getByRole('button', { name: /^Start/ }).first();

  await input.fill(CANONICAL);
  await expect(page.getByText('No captions? AI will transcribe it (up to 15 min)')).toBeVisible();
  await expect(start).toBeEnabled();
  await start.click();
  await expect(page.locator('p[role="alert"]')).toHaveText("You're going a bit fast. Wait a minute and try again.");

  mode = 'unavailable';
  await input.fill('https://www.youtube.com/watch?v=privateVid1');
  await expect(page.getByText("This video is private, removed, or can't be embedded.")).toBeVisible();
  await expect(start).toBeDisabled();
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });
  test('starter with a preview card does not scroll horizontally', async ({ page }) => {
    await mockApi(page, { '/dictation/url-preview': () => preview({ title: 'Ein sehr langer Videotitel '.repeat(6) }) });
    await page.goto('/vi/practice-test/dictation/shadow');
    await page.getByLabel('Link YouTube').fill(CANONICAL);
    await expect(page.getByText('Thiếu phụ đề? AI sẽ tự chép lời (tối đa 15 phút)')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await page.getByLabel('Link YouTube').scrollIntoViewIfNeeded();
    await page.locator('section').filter({ has: page.getByLabel('Link YouTube') }).screenshot({ path: 'test-results/youtube-url-starter-mobile.png' });  });
});
