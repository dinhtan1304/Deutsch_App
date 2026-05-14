import type { NextConfig } from "next";

// Derive HTTP + WebSocket origins for connect-src so Socket.IO can upgrade to
// ws:// (or wss:// in production) on the same API host.
function apiConnectOrigins(): string {
  if (!process.env.NEXT_PUBLIC_API_URL) return '';
  try {
    const u = new URL(process.env.NEXT_PUBLIC_API_URL);
    const httpOrigin = u.origin;
    const wsOrigin = `${u.protocol === 'https:' ? 'wss:' : 'ws:'}//${u.host}`;
    return `${httpOrigin} ${wsOrigin}`;
  } catch {
    return '';
  }
}

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'production' ? '' : " 'unsafe-eval'"} https://www.google.com https://www.gstatic.com https://www.googletagmanager.com https://www.youtube.com https://s.ytimg.com`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https: http:",
      "font-src 'self' https://fonts.gstatic.com",
      `connect-src 'self' ${apiConnectOrigins()} https://*.deutschmeister.com https://*.railway.app wss://*.railway.app https://www.google.com https://www.googleapis.com`,
      "frame-src 'self' https://www.google.com https://www.youtube.com",
      "media-src 'self' blob: data:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      // User-uploaded avatars/covers served from the API host
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'deutschmeister-api-production.up.railway.app' },
      ...(process.env.NEXT_PUBLIC_API_URL
        ? (() => {
            try {
              const u = new URL(process.env.NEXT_PUBLIC_API_URL!);
              return [{ protocol: u.protocol.replace(':', '') as 'http' | 'https', hostname: u.hostname }];
            } catch {
              return [];
            }
          })()
        : []),
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
