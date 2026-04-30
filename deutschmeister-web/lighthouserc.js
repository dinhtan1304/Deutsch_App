/** @type {import('@lhci/cli').LighthouseRcConfig} */
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 30000,
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/pricing',
        'http://localhost:3000/privacy',
        'http://localhost:3000/terms',
      ],
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
      },
    },
    assert: {
      preset: 'lighthouse:no-pwa',
      assertions: {
        // Core Web Vitals — hard gates
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],

        // Performance targets — warnings
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
        'interactive': ['warn', { maxNumericValue: 3800 }],
        'speed-index': ['warn', { maxNumericValue: 3400 }],

        // Category scores
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],

        // Bundle size — warn if JS payload exceeds budget
        'total-byte-weight': ['warn', { maxNumericValue: 500 * 1024 }],
        'unused-javascript': ['warn', { maxLength: 0 }],
        'uses-text-compression': 'warn',
        'uses-optimized-images': 'warn',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
