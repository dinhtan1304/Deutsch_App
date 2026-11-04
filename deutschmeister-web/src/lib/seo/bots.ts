/**
 * Crawlers that read the whole site and send nobody back: AI training scrapers
 * and SEO-tool indexes. Search engines, link previews (Facebook, Zalo, Telegram)
 * and user-triggered AI browsing (ChatGPT-User, OAI-SearchBot, PerplexityBot,
 * Claude-User, Claude-SearchBot) stay allowed — those can bring a visitor.
 *
 * robots.txt asks; `proxy.ts` enforces, because some of these ignore robots.txt.
 */
const CRAWLERS = [
  // AI training
  'GPTBot',
  'ClaudeBot',
  'anthropic-ai',
  'CCBot',
  'Bytespider',
  'Amazonbot',
  'meta-externalagent',
  'FacebookBot',
  'cohere-ai',
  'cohere-training-data-crawler',
  'Diffbot',
  'ImagesiftBot',
  'Omgilibot',
  'Timpibot',
  'PanguBot',
  'AI2Bot',
  'img2dataset',
  // SEO tools
  'AhrefsBot',
  'SemrushBot',
  'MJ12bot',
  'DotBot',
  'DataForSeoBot',
  'BLEXBot',
  'PetalBot',
  'SeekportBot',
  'serpstatbot',
  'Barkrowler',
  'MegaIndex',
];

/** Tokens that only exist in robots.txt: these crawlers share a normal search bot's UA. */
const ROBOTS_ONLY_TOKENS = ['Google-Extended', 'Applebot-Extended'];

/** Bare HTTP clients. They never read robots.txt, and no browser or search engine sends them. */
const SCRIPT_CLIENTS = ['Scrapy', 'python-requests', 'python-urllib', 'aiohttp', 'Go-http-client', 'libwww-perl'];

export const ROBOTS_BLOCKED_AGENTS = [...CRAWLERS, ...ROBOTS_ONLY_TOKENS];

const BLOCKED_UA = new RegExp(
  [...CRAWLERS, ...SCRIPT_CLIENTS].map((name) => name.replace(/[-.]/g, '\\$&')).join('|'),
  'i',
);

export function isBlockedBot(userAgent: string | null): boolean {
  return !!userAgent && BLOCKED_UA.test(userAgent);
}
