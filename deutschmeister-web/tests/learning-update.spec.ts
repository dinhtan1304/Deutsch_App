import { test, expect, type Page } from '@playwright/test';
import { APP_RELEASE } from '../src/config/release';

test('release dialog renders in the saved dark theme', async ({ page }) => {
  await blockExternalApi(page);
  await page.addInitScript(() => localStorage.setItem('deutschmeister-settings', JSON.stringify({ theme: 'dark' })));
  await page.goto('/en/games');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.screenshot({ path: '.audit-popup-dark.png' });
});

test.describe('PWA offline navigation', () => {
  test.use({ serviceWorkers: 'allow' });
  test('the offline review page reloads without a network connection', async ({ page, context }) => {
    await blockExternalApi(page);
    await page.goto('/en/offline-review');
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }));
      }
    });
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Offline vocabulary review' })).toBeVisible();
    await expect.poll(() => page.evaluate(async () => {
      const names = await caches.keys();
      const pages = await caches.open(names.find((name) => name.startsWith('dm-pages-'))!);
      return (await pages.keys()).some((request) => new URL(request.url).pathname === '/en/offline-review');
    })).toBe(true);
    await context.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Offline vocabulary review' })).toBeVisible();
    await expect(page.getByText('No offline deck yet. Log in and download cards while connected.')).toBeVisible();
  });
});

test('offline reviews atomically remove cards and persist pending work after reload', async ({
  page,
}) => {
  await blockExternalApi(page);
  await page.goto('/en/offline-review');
  await page.evaluate(async () => {
    localStorage.setItem('dm:offline-owner', 'offline-learner');
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('dm-offline-learning-v1', 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('decks', { keyPath: 'ownerId' });
        request.result.createObjectStore('outbox', { keyPath: 'requestId' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve) => {
      const tx = db.transaction('decks', 'readwrite');
      tx.objectStore('decks').put({
        ownerId: 'offline-learner',
        downloadedAt: new Date().toISOString(),
        cards: [
          {
            wordId: 'haus',
            totalReviews: 0,
            nextReviewAt: new Date(0).toISOString(),
            word: {
              word: 'Haus',
              article: 'das',
              translationEn: 'house',
              examples: [],
            },
          },
        ],
      });
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
    });
  });
  await page.reload();
  await page.getByRole('button', { name: 'Show meaning' }).click();
  await page.getByRole('button', { name: 'Good', exact: true }).click();
  await expect(
    page.getByText('0 cards remaining · 1 reviews pending'),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText('0 cards remaining · 1 reviews pending'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Show meaning' })).toHaveCount(
    0,
  );
});

test('authenticated daily checklist persists completion through reload', async ({
  page,
}) => {
  const session = {
    id: 'daily-test',
    sessionKey: 'daily:test',
    steps: [
      { id: 'review', kind: 'srs', href: '/review', minutes: 5, count: 10 },
    ],
    completed: [] as string[],
    createdAt: new Date().toISOString(),
  };
  await page.addInitScript((release) => {
    localStorage.setItem('dm_session_hint', '1');
    localStorage.setItem(`dm:release-seen:${release}`, 'seen');
  }, APP_RELEASE.id);
  await page.route('**/api/**', (route) => {
    const url = new URL(route.request().url());
    let response: unknown;
    if (url.pathname.endsWith('/auth/refresh'))
      response = { accessToken: 'browser-test-token' };
    else if (url.pathname.endsWith('/auth/bootstrap'))
      response = {
        user: {
          id: 'test-learner',
          email: 'test@example.test',
          name: 'Learner',
          avatar: null,
          role: 'user',
          emailVerified: true,
          onboardingCompleted: true,
          createdAt: new Date().toISOString(),
        },
        settings: {},
        subscription: { plan: 'free', status: 'active', expiresAt: null },
        unreadCount: { count: 0 },
        xp: {
          xp: 0,
          level: 1,
          name: 'Starter',
          nameVi: 'Starter',
          progress: 0,
        },
        streak: 0,
      };
    else if (url.pathname.endsWith('/learning/today')) response = session;
    else if (url.pathname.endsWith('/learning/sessions/daily-test/complete')) {
      session.completed = ['review'];
      response = session;
    } else
      return route.fulfill({
        status: 503,
        json: { message: 'Unused test endpoint' },
      });
    return route.fulfill({ status: 200, json: response });
  });
  await page.goto('/en/learning-session');
  await expect(
    page.getByRole('heading', { name: "Today's study session" }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Mark complete' }).click();
  await expect(
    page.getByRole('button', { name: 'Completed', exact: true }),
  ).toBeDisabled();
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Completed', exact: true }),
  ).toBeDisabled();
});

const releaseKey = `dm:release-seen:${APP_RELEASE.id}`;
const titles = {
  vi: 'Học có định hướng, tiến bộ mỗi ngày',
  en: 'A clearer path to daily progress',
  de: 'Mit einem klaren Plan täglich lernen',
};
const gameReleaseCopy = {
  vi: {
    body: '6 game A1–B2: Xếp câu, Ghép cụm từ, Thám tử ngữ pháp, Số nhiều, Gia đình từ và Hội thoại. Có giải thích đáp án và ôn lại câu sai.',
    button: 'Khám phá game mới',
  },
  en: {
    body: '6 A1–B2 games: Sentence Builder, Word Connections, Grammar Detective, Plurals, Word Families and Dialogue Quest. Get explanations and review mistakes.',
    button: 'Explore new games',
  },
  de: {
    body: '6 Spiele für A1–B2: Satzbau, Wortverbindungen, Grammatikdetektiv, Plural, Wortfamilien und Dialogreise. Mit Erklärungen und Fehlerwiederholung.',
    button: 'Neue Spiele entdecken',
  },
};

async function blockExternalApi(page: Page) {
  await page.route('**/api/**', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Test API unavailable' }),
    }),
  );
}

for (const locale of ['vi', 'en', 'de'] as const) {
  test(`announcement shows once, closes with Escape and can reopen (${locale})`, async ({
    page,
  }) => {
    await blockExternalApi(page);
    const failures: string[] = [];
    page.on('pageerror', (error) => failures.push(error.message));
    await page.goto(`/${locale}/games`);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { level: 2 })).toHaveText(
      titles[locale],
    );
    await expect(dialog).toContainText('864');
    await expect(
      dialog.getByText(gameReleaseCopy[locale].body, { exact: true }),
    ).toBeVisible();
    await expect(
      dialog.getByRole('button', {
        name: gameReleaseCopy[locale].button,
        exact: true,
      }),
    ).toBeVisible();
    if (locale === 'vi') {
      await dialog.screenshot({ path: '.audit-popup-vi-fixed.png' });
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    expect(
      await page.evaluate((key) => localStorage.getItem(key), releaseKey),
    ).toBe('seen');
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.waitForTimeout(1600);
    await expect(dialog).toHaveCount(0);
    await page.goto(`/${locale}/updates`);
    await expect(
      page.getByText(gameReleaseCopy[locale].body, { exact: true }),
    ).toBeVisible();
    const reopen = {
      vi: 'Xem lại cập nhật',
      en: 'View updates again',
      de: 'Updates erneut ansehen',
    };
    await page.getByRole('button', { name: reopen[locale] }).click();
    await expect(dialog).toBeVisible();
    expect(failures).toEqual([]);
  });
}

test('announcement fits mobile and keeps keyboard focus inside the dialog', async ({
  page,
}) => {
  await blockExternalApi(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en/games');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'See details' })).toBeInViewport();
  for (let index = 0; index < 6; index++) {
    await page.keyboard.press('Tab');
    expect(
      await dialog.evaluate((element) =>
        element.contains(document.activeElement),
      ),
    ).toBe(true);
  }
  const size = await dialog.evaluate((element) => ({
    width: element.scrollWidth,
    viewport: innerWidth,
  }));
  expect(size.width).toBeLessThanOrEqual(size.viewport);
  await page.screenshot({ path: '.audit-popup-mobile.png', fullPage: true });
});

test('auth pages do not automatically show the announcement', async ({
  page,
}) => {
  await blockExternalApi(page);
  await page.goto('/en/auth/login');
  await page.waitForTimeout(1800);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(
    await page.evaluate((key) => localStorage.getItem(key), releaseKey),
  ).toBeNull();
});

test('new learning routes show sign-in and offline works without a session', async ({
  page,
}) => {
  await blockExternalApi(page);
  for (const route of [
    'learning-session',
    'error-notebook',
    'practice-packs',
  ]) {
    await page.goto(`/en/${route}`);
    await expect(page).toHaveURL(/\/auth\/login\?returnTo=/);
  }
  await page.goto('/en/offline-review');
  await expect(
    page.getByRole('heading', { name: 'Offline vocabulary review' }),
  ).toBeVisible();
  await expect(
    page.getByText(
      'No offline deck yet. Log in and download cards while connected.',
    ),
  ).toBeVisible();
});

test('practice pack vocabulary links prefill the dictionary search', async ({
  page,
}) => {
  await blockExternalApi(page);
  await page.goto('/en/words?search=Wohnung');
  await expect(
    page
      .locator('input')
      .filter({ hasNot: page.locator('[type="hidden"]') })
      .first(),
  ).toHaveValue('Wohnung');
});
