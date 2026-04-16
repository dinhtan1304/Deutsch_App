export type ResourceSkill = 'reading' | 'listening' | 'grammar' | 'vocabulary' | 'all';
export type ResourceLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
export type ResourceType = 'news' | 'podcast' | 'video' | 'blog' | 'website' | 'youtube';

export interface AuthenticResource {
  id: string;
  title: string;
  titleVi: string;
  url: string;
  level: ResourceLevel;
  skill: ResourceSkill;
  type: ResourceType;
  descriptionVi: string;
  source: string;
  free: boolean;
}

export const AUTHENTIC_RESOURCES: AuthenticResource[] = [
  // ── A1 / A2 ───────────────────────────────────────────────────────────
  {
    id: 'dw-nicos-weg',
    title: 'Nicos Weg',
    titleVi: 'Khóa Nicos Weg của DW',
    url: 'https://learngerman.dw.com/de/nicos-weg/c-36519789',
    level: 'A1',
    skill: 'all',
    type: 'website',
    descriptionVi: 'Khóa học miễn phí của Deutsche Welle — phim ngắn + bài tập từ A1 đến B1. Chất lượng sư phạm rất cao.',
    source: 'Deutsche Welle',
    free: true,
  },
  {
    id: 'easy-german-yt',
    title: 'Easy German (YouTube)',
    titleVi: 'Easy German — phỏng vấn đường phố',
    url: 'https://www.youtube.com/@EasyGerman',
    level: 'A2',
    skill: 'listening',
    type: 'youtube',
    descriptionVi: 'Phỏng vấn người Đức thật ngoài đường, có phụ đề DE + EN. Chuẩn ngôn ngữ hằng ngày.',
    source: 'Easy German',
    free: true,
  },
  {
    id: 'dw-langsam-nachrichten',
    title: 'Langsam gesprochene Nachrichten',
    titleVi: 'Tin tức Đức đọc chậm (DW)',
    url: 'https://learngerman.dw.com/de/nachrichten/s-8030',
    level: 'A2',
    skill: 'listening',
    type: 'news',
    descriptionVi: 'Tin tức hằng ngày được đọc chậm rõ ràng kèm transcript. Tuyệt vời cho luyện nghe A2-B1.',
    source: 'Deutsche Welle',
    free: true,
  },
  {
    id: 'nachrichtenleicht',
    title: 'Nachrichtenleicht',
    titleVi: 'Báo Đức ngôn ngữ đơn giản',
    url: 'https://www.nachrichtenleicht.de/',
    level: 'A2',
    skill: 'reading',
    type: 'news',
    descriptionVi: 'Tin tức của Deutschlandfunk viết bằng Leichte Sprache — câu ngắn, ít từ khó. Phù hợp A2-B1.',
    source: 'Deutschlandfunk',
    free: true,
  },

  // ── B1 ────────────────────────────────────────────────────────────────
  {
    id: 'dw-top-thema',
    title: 'Top-Thema mit Vokabeln',
    titleVi: 'Chủ đề hàng đầu (DW) — kèm từ vựng',
    url: 'https://learngerman.dw.com/de/top-thema/s-8031',
    level: 'B1',
    skill: 'reading',
    type: 'news',
    descriptionVi: 'Bài viết 300-400 từ về chủ đề thời sự, kèm audio và glossary từ vựng. Lý tưởng cho B1.',
    source: 'Deutsche Welle',
    free: true,
  },
  {
    id: 'slowgerman',
    title: 'Slow German',
    titleVi: 'Slow German Podcast',
    url: 'https://slowgerman.com/',
    level: 'B1',
    skill: 'listening',
    type: 'podcast',
    descriptionVi: 'Podcast về văn hóa và cuộc sống Đức, đọc chậm, có transcript. Cực kỳ phù hợp cho người học B1.',
    source: 'Annik Rubens',
    free: true,
  },
  {
    id: 'easy-german-podcast',
    title: 'Easy German Podcast',
    titleVi: 'Easy German Podcast',
    url: 'https://www.easygerman.fm/',
    level: 'B1',
    skill: 'listening',
    type: 'podcast',
    descriptionVi: 'Podcast hằng tuần bằng tiếng Đức đời thường. Membership có transcript + bài tập.',
    source: 'Easy German',
    free: true,
  },

  // ── B2 ────────────────────────────────────────────────────────────────
  {
    id: 'dw-deutsch-aktuell',
    title: 'Deutsch aktuell',
    titleVi: 'Tin tức Đức nguyên bản (DW)',
    url: 'https://www.dw.com/de/themen/s-9077',
    level: 'B2',
    skill: 'reading',
    type: 'news',
    descriptionVi: 'Tin tức tiếng Đức bản gốc của Deutsche Welle — không đơn giản hóa. Cho học viên B2+.',
    source: 'Deutsche Welle',
    free: true,
  },
  {
    id: 'zeit-online',
    title: 'Zeit Online',
    titleVi: 'Tạp chí Die Zeit',
    url: 'https://www.zeit.de/',
    level: 'B2',
    skill: 'reading',
    type: 'news',
    descriptionVi: 'Tạp chí uy tín của Đức với bài viết chuyên sâu. Bài miễn phí giới hạn/tháng.',
    source: 'Die Zeit',
    free: false,
  },
  {
    id: 'tagesschau',
    title: 'Tagesschau',
    titleVi: 'Tagesschau — bản tin 20 giờ',
    url: 'https://www.tagesschau.de/',
    level: 'B2',
    skill: 'listening',
    type: 'news',
    descriptionVi: 'Bản tin thời sự số 1 của Đức. Xem video để luyện nghe tiếng Đức chuẩn.',
    source: 'ARD',
    free: true,
  },
  {
    id: 'deutschlandfunk',
    title: 'Deutschlandfunk',
    titleVi: 'Deutschlandfunk Radio',
    url: 'https://www.deutschlandfunk.de/',
    level: 'B2',
    skill: 'listening',
    type: 'podcast',
    descriptionVi: 'Đài phát thanh quốc gia — hàng trăm podcast về chính trị, khoa học, văn hóa.',
    source: 'Deutschlandfunk',
    free: true,
  },

  // ── C1 ────────────────────────────────────────────────────────────────
  {
    id: 'spiegel-online',
    title: 'Der Spiegel',
    titleVi: 'Der Spiegel',
    url: 'https://www.spiegel.de/',
    level: 'C1',
    skill: 'reading',
    type: 'news',
    descriptionVi: 'Tạp chí tin tức hàng đầu — ngôn ngữ phức tạp, phù hợp C1+.',
    source: 'Der Spiegel',
    free: false,
  },
  {
    id: 'lanzkrimi-podcast',
    title: 'Lanz & Precht',
    titleVi: 'Lanz & Precht Podcast',
    url: 'https://www.zdf.de/gesellschaft/lanz-precht',
    level: 'C1',
    skill: 'listening',
    type: 'podcast',
    descriptionVi: 'Podcast đối thoại triết học/thời sự giữa Markus Lanz và Richard David Precht — tiếng Đức học thuật.',
    source: 'ZDF',
    free: true,
  },
  {
    id: 'arte-de',
    title: 'ARTE Deutsch',
    titleVi: 'ARTE — truyền hình văn hóa',
    url: 'https://www.arte.tv/de/',
    level: 'C1',
    skill: 'listening',
    type: 'video',
    descriptionVi: 'Kênh truyền hình văn hóa Pháp-Đức với phim tài liệu chất lượng cao, nhiều phụ đề.',
    source: 'ARTE',
    free: true,
  },
];

export const SKILL_LABELS: Record<ResourceSkill, string> = {
  all: 'Tất cả',
  reading: 'Đọc',
  listening: 'Nghe',
  grammar: 'Ngữ pháp',
  vocabulary: 'Từ vựng',
};

export const LEVEL_LABELS: Record<ResourceLevel | 'all', string> = {
  all: 'Tất cả trình độ',
  A1: 'A1',
  A2: 'A2',
  B1: 'B1',
  B2: 'B2',
  C1: 'C1',
};

export const TYPE_LABELS: Record<ResourceType, string> = {
  news: 'Tin tức',
  podcast: 'Podcast',
  video: 'Video',
  blog: 'Blog',
  website: 'Website',
  youtube: 'YouTube',
};

export const TYPE_ICONS: Record<ResourceType, string> = {
  news: '📰',
  podcast: '🎧',
  video: '🎬',
  blog: '✍️',
  website: '🌐',
  youtube: '▶️',
};
