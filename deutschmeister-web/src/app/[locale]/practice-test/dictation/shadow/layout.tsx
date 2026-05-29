import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Luyện Shadowing — DeutschMeister',
  description: 'Luyện phát âm tiếng Đức bằng kỹ thuật shadowing: nghe câu mẫu rồi nói theo để bắt chước nhịp + ngữ điệu native.',
};

export default function ShadowingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
