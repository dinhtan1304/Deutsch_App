/* eslint-disable no-restricted-syntax -- manifest requires literal theme/background colors */
import type { MetadataRoute } from 'next';

// Served at /manifest.webmanifest; Next.js injects <link rel="manifest"> automatically.
// Makes the web app installable (Add to Home Screen) — see PWAInstallPrompt.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DeutschMeister — Học tiếng Đức cùng AI',
    short_name: 'DeutschMeister',
    description: 'Học tiếng Đức toàn diện: từ vựng, mini-games, luyện thi Goethe & TELC, AI chấm Writing & Speaking.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0A0C11',
    theme_color: '#0A0C11',
    lang: 'vi',
    categories: ['education'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
