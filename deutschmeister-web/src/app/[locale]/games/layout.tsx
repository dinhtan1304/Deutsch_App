import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mini-Games học tiếng Đức',
  description: '8 trò chơi học tiếng Đức thú vị: Flashcards SRS, Der/Die/Das Quiz, Listening Game, Spelling Bee, Word Match và hơn thế nữa. Luyện phản xạ từ vựng hiệu quả.',
  openGraph: {
    title: 'Mini-Games học tiếng Đức — Deutschmeister',
    description: '8 trò chơi luyện phản xạ từ vựng: Flashcards, Der/Die/Das Quiz, Spelling Bee, Listening và nhiều hơn nữa.',
    url: '/games',
  },
  alternates: { canonical: '/games' },
};

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
