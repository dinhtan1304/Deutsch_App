'use client';

import Link from 'next/link';
import { Card, Button } from '@/components/ui';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';

interface Rule {
  icon: string;
  title: string;
  body: string;
}

const RULES: Rule[] = [
  {
    icon: '🤝',
    title: 'Tôn trọng đối thủ',
    body: 'Không xúc phạm, miệt thị hay chế giễu người chơi khác trong tên phòng, tin nhắn hoặc giọng nói. Mọi người ở đây đều đang học — hãy đối xử như bạn muốn được đối xử.',
  },
  {
    icon: '🛡️',
    title: 'Không gian lận',
    body: 'Trả lời bằng kiến thức của bạn. Không dùng bot tự trả lời, từ điển bật sẵn, hoặc nhờ người khác mách bài. Chúng tôi có thể phát hiện thời gian phản hồi bất thường và gắn cờ tài khoản.',
  },
  {
    icon: '🚫',
    title: 'Không spam, không quấy rối',
    body: 'Đừng tạo hàng loạt phòng để spam danh sách, đừng gửi câu trả lời lặp lại, đừng quấy rối qua mã mời hoặc mật khẩu. Mỗi vòng có giới hạn 50 lần thử để chống brute-force.',
  },
  {
    icon: '🎙️',
    title: 'Phòng Luyện Nói',
    body: 'Nói tiếng Đức/Việt thân thiện. Không nói tục, không phát nội dung 18+, không quảng cáo dịch vụ bên ngoài. Mic của bạn được phát trực tiếp tới bạn ghép cặp — hãy cư xử như đang gặp ngoài đời.',
  },
  {
    icon: '🏷️',
    title: 'Tên phòng & mật khẩu',
    body: 'Đặt tên phòng có nghĩa (vd "Phòng ôn A2", "Tan & bạn"). Tránh từ ngữ tục tĩu, kích động chính trị, hoặc quảng cáo. Mật khẩu phòng là chuỗi ngắn để chia sẻ với bạn bè — không phải dữ liệu nhạy cảm.',
  },
  {
    icon: '🐞',
    title: 'Báo cáo vi phạm',
    body: 'Bấm nút "🐞 Báo lỗi · Góp ý" ở mỗi tính năng beta để báo người chơi vi phạm. Mô tả ngắn gọn + thời gian xảy ra. Chúng tôi rà soát trong 48 giờ.',
  },
  {
    icon: '⚠️',
    title: 'Hậu quả khi vi phạm',
    body: 'Lần 1: cảnh báo. Lần 2: tạm khoá Đấu trường / Phòng nói trong 7 ngày. Lần 3: khoá tài khoản vĩnh viễn. Hành vi nghiêm trọng (đe doạ, quấy rối tình dục, lộ thông tin cá nhân người khác) có thể bị khoá ngay không cần cảnh báo.',
  },
  {
    icon: '🔒',
    title: 'Quyền riêng tư',
    body: 'Không chia sẻ email, số điện thoại, địa chỉ của bản thân hoặc người khác qua phòng. Tên hiển thị, avatar và level CEFR là mọi thứ đối thủ cần thấy.',
  },
];

export default function CommunityRulesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <div
        className="rounded-2xl p-6 sm:p-8 mb-6 text-white shadow-lifted"
        style={{ background: GRADIENT.vocab }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            📜
          </div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
              Quy tắc Cộng đồng
            </h1>
            <p className="text-body mt-1 opacity-90">
              Áp dụng cho Đấu trường Từ vựng và Phòng Luyện Nói. Tham gia
              tức là bạn đồng ý với các quy tắc dưới đây.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {RULES.map((r, i) => (
          <Card key={i}>
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ background: 'rgba(139,92,246,.12)' }}
              >
                {r.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="font-semibold mb-1"
                  style={{ color: 'var(--theme-text-primary)' }}
                >
                  {i + 1}. {r.title}
                </div>
                <div
                  className="text-body"
                  style={{ color: 'var(--theme-text-secondary)' }}
                >
                  {r.body}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div
        className="rounded-xl p-4 mb-6"
        style={{
          background: 'rgba(59,130,246,.08)',
          border: '1px solid rgba(59,130,246,.25)',
        }}
      >
        <div
          className="text-caption font-semibold mb-1"
          style={{ color: ACCENT.srs }}
        >
          🌱 Đang trong giai đoạn beta
        </div>
        <div
          className="text-body"
          style={{ color: 'var(--theme-text-secondary)' }}
        >
          Đấu trường và Phòng Luyện Nói còn mới — chúng tôi đang lắng nghe phản hồi
          để hoàn thiện cả tính năng lẫn quy tắc. Nếu bạn thấy điều gì bất hợp lý
          hoặc thiếu sót, vui lòng gửi góp ý qua nút "🐞 Báo lỗi · Góp ý" trong từng
          tính năng.
        </div>
      </div>

      <div
        className="text-caption text-center"
        style={{ color: 'var(--theme-text-muted)' }}
      >
        Cập nhật ngày 14/05/2026
      </div>

      <div className="flex flex-wrap gap-3 justify-center mt-6">
        <Link href="/arena">
          <Button variant="primary" style={{ background: GRADIENT.vocab }}>
            ⚔️ Vào Đấu trường
          </Button>
        </Link>
        <Link href="/practice-test/speaking-rooms">
          <Button variant="outline">🎙️ Vào Phòng Luyện Nói</Button>
        </Link>
      </div>
    </div>
  );
}
