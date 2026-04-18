import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ngữ pháp tiếng Đức',
  description: 'Học ngữ pháp tiếng Đức từ A1 đến B1: Kasus, Artikel, Konjugation, Modalverben và hơn 50 bài học chi tiết. Giải thích bằng tiếng Việt, dễ hiểu dễ nhớ.',
  openGraph: {
    title: 'Ngữ pháp tiếng Đức — Deutschmeister',
    description: 'Hơn 50 bài học ngữ pháp tiếng Đức A1-B1, giải thích bằng tiếng Việt. Kasus, Artikel, Modalverben và nhiều hơn nữa.',
    url: '/grammar',
  },
  alternates: { canonical: '/grammar' },
};

export default function GrammarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
