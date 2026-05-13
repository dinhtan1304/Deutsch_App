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
  {
    id: 'dw-nicos-weg',
    title: 'Nicos Weg',
    titleVi: 'Khóa Nicos Weg của DW',
    url: 'https://learngerman.dw.com/de/nicos-weg/c-36519789',
    level: 'A1',
    skill: 'all',
    type: 'website',
    descriptionVi: 'Khóa học miễn phí của Deutsche Welle với phim ngắn và bài tập từ A1 đến B1. Phù hợp để bắt đầu học có lộ trình.',
    source: 'Deutsche Welle',
    free: true,
  },
  {
    id: 'easy-german-yt',
    title: 'Easy German (YouTube)',
    titleVi: 'Easy German - phỏng vấn đường phố',
    url: 'https://www.youtube.com/@EasyGerman',
    level: 'A2',
    skill: 'listening',
    type: 'youtube',
    descriptionVi: 'Phỏng vấn người Đức trong đời sống thường ngày, thường có phụ đề tiếng Đức và tiếng Anh. Tốt cho nghe hiểu tự nhiên.',
    source: 'Easy German',
    free: true,
  },
  {
    id: 'dw-langsam-nachrichten',
    title: 'Langsam gesprochene Nachrichten',
    titleVi: 'Tin tức Đức đọc chậm của DW',
    url: 'https://learngerman.dw.com/de/nachrichten/s-8030',
    level: 'A2',
    skill: 'listening',
    type: 'news',
    descriptionVi: 'Tin tức hằng ngày được đọc chậm, rõ ràng và có transcript. Hữu ích cho người học A2 đến B1.',
    source: 'Deutsche Welle',
    free: true,
  },
  {
    id: 'nachrichtenleicht',
    title: 'Nachrichtenleicht',
    titleVi: 'Báo Đức bằng ngôn ngữ đơn giản',
    url: 'https://www.nachrichtenleicht.de/',
    level: 'A2',
    skill: 'reading',
    type: 'news',
    descriptionVi: 'Tin tức của Deutschlandfunk viết bằng Leichte Sprache: câu ngắn, ít từ khó, dễ dùng để luyện đọc đều đặn.',
    source: 'Deutschlandfunk',
    free: true,
  },
  {
    id: 'dw-top-thema',
    title: 'Top-Thema mit Vokabeln',
    titleVi: 'Chủ đề thời sự của DW kèm từ vựng',
    url: 'https://learngerman.dw.com/de/top-thema/s-8031',
    level: 'B1',
    skill: 'reading',
    type: 'news',
    descriptionVi: 'Bài đọc ngắn về thời sự, thường kèm audio và phần giải thích từ vựng. Rất hợp để nâng vốn từ B1.',
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
    descriptionVi: 'Podcast về văn hóa và cuộc sống ở Đức, đọc chậm và có transcript. Phù hợp cho người học muốn nghe chủ đề đời sống.',
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
    descriptionVi: 'Podcast hằng tuần bằng tiếng Đức đời thường. Có nhiều đoạn hội thoại tự nhiên, membership có thêm transcript và bài tập.',
    source: 'Easy German',
    free: true,
  },
  {
    id: 'dw-deutsch-aktuell',
    title: 'Deutsch aktuell',
    titleVi: 'Tin tức Đức nguyên bản của DW',
    url: 'https://www.dw.com/de/themen/s-9077',
    level: 'B2',
    skill: 'reading',
    type: 'news',
    descriptionVi: 'Tin tức tiếng Đức bản gốc của Deutsche Welle, không đơn giản hóa. Hợp với người học B2 muốn đọc văn phong báo chí thật.',
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
    descriptionVi: 'Tạp chí uy tín của Đức với nhiều bài phân tích chuyên sâu. Một số nội dung có giới hạn miễn phí theo tháng.',
    source: 'Die Zeit',
    free: false,
  },
  {
    id: 'tagesschau',
    title: 'Tagesschau',
    titleVi: 'Tagesschau - bản tin 20 giờ',
    url: 'https://www.tagesschau.de/',
    level: 'B2',
    skill: 'listening',
    type: 'news',
    descriptionVi: 'Bản tin thời sự hàng đầu của Đức. Dùng video và audio để luyện nghe tốc độ bản xứ với phát âm chuẩn truyền hình.',
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
    descriptionVi: 'Đài phát thanh quốc gia với nhiều chương trình về chính trị, khoa học và văn hóa. Phù hợp cho nghe chuyên sâu.',
    source: 'Deutschlandfunk',
    free: true,
  },
  {
    id: 'spiegel-online',
    title: 'Der Spiegel',
    titleVi: 'Der Spiegel',
    url: 'https://www.spiegel.de/',
    level: 'C1',
    skill: 'reading',
    type: 'news',
    descriptionVi: 'Tạp chí tin tức lớn của Đức với ngôn ngữ phong phú và lập luận phức tạp. Hợp với người học C1 trở lên.',
    source: 'Der Spiegel',
    free: false,
  },
  {
    id: 'lanz-precht-podcast',
    title: 'Lanz & Precht',
    titleVi: 'Lanz & Precht Podcast',
    url: 'https://www.zdf.de/gesellschaft/lanz-precht',
    level: 'C1',
    skill: 'listening',
    type: 'podcast',
    descriptionVi: 'Podcast đối thoại về triết học và thời sự giữa Markus Lanz và Richard David Precht. Ngôn ngữ giàu sắc thái.',
    source: 'ZDF',
    free: true,
  },
  {
    id: 'arte-de',
    title: 'ARTE Deutsch',
    titleVi: 'ARTE - truyền hình văn hóa',
    url: 'https://www.arte.tv/de/',
    level: 'C1',
    skill: 'listening',
    type: 'video',
    descriptionVi: 'Kênh truyền hình văn hóa Pháp-Đức với nhiều phim tài liệu chất lượng cao, phù hợp để luyện nghe chủ đề học thuật.',
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
  news: 'newspaper',
  podcast: 'headphones',
  video: 'video',
  blog: 'pen',
  website: 'globe',
  youtube: 'play',
};
