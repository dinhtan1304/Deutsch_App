import Link from 'next/link';
/* eslint-disable no-restricted-syntax */

const FAQ_ITEMS = [
  { q: 'App có thực sự miễn phí không?', a: 'Có. Tất cả từ vựng, mini-games, ngữ pháp, chủ đề hoàn toàn miễn phí mãi mãi. Chỉ các tính năng AI nâng cao (luyện thi Goethe/TELC, chấm writing/speaking) mới cần Premium — với giới hạn 3 lần/tuần cho Free.' },
  { q: 'Tôi cần trả phí để luyện thi Goethe/TELC không?', a: 'Free users có 3 lần/tuần để dùng tất cả tính năng AI bao gồm luyện thi. Premium sẽ mở không giới hạn tất cả đề thi A1/A2/B1, AI chấm bài, và AI giải thích lỗi bằng tiếng Việt.' },
  { q: 'AI chấm bài tiếng Đức có chính xác không?', a: 'Deutschmeister dùng Gemini AI của Google — được train trên dữ liệu ngôn ngữ khổng lồ. AI chấm theo đúng tiêu chí của Goethe/TELC: ngữ pháp, từ vựng, cấu trúc câu, nội dung. Mỗi lỗi đều có giải thích chi tiết bằng tiếng Việt.' },
  { q: 'Thanh toán Premium như thế nào?', a: 'Chuyển khoản ngân hàng hoặc quét mã VietQR. Sau khi chuyển khoản với đúng nội dung, admin xác nhận trong vòng vài giờ (tối đa 24h) và Premium tự động kích hoạt. Xem chi tiết tại trang Pricing.' },
  { q: 'App hỗ trợ những trình độ nào?', a: 'A1 (sơ cấp), A2 (cơ bản), B1 (trung cấp) — đầy đủ 4 kỹ năng Nghe/Nói/Đọc/Viết theo format Goethe-Zertifikat và TELC Deutsch. Phù hợp cho người mới bắt đầu đến người chuẩn bị thi.' },
  { q: 'Cần cài đặt gì không? Có app di động không?', a: 'Không cần cài đặt — chạy hoàn toàn trên trình duyệt web. App di động (Android/iOS) đang phát triển, sẽ ra mắt sớm. Tài khoản dùng chung trên cả web và mobile.' },
  { q: 'Lifetime deal là gì?', a: 'Trả 1 lần, dùng mãi mãi — không cần gia hạn hàng tháng/năm. Đây là Early Bird deal giới hạn chỉ 500 suất đầu tiên. Bạn sẽ nhận Early Backer badge và ưu tiên tính năng mới. Khi hết 500 suất là không mở lại.' },
];

export function LandingFaq() {
  return (
    <section id="faq" style={{ padding: '96px 24px', maxWidth: 760, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 100, background: 'rgba(59,130,246,.12)', border: '1px solid rgba(59,130,246,.3)', fontSize: 12.5, fontWeight: 700, color: '#60A5FA', marginBottom: 16 }}>
          CÂU HỎI THƯỜNG GẶP
        </div>
        <h2 className="section-title" style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-1px', marginBottom: 12 }}>
          Bạn đang <span className="gradient-text">thắc mắc</span> gì?
        </h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {FAQ_ITEMS.map(({ q, a }) => (
          <details key={q} style={{ borderRadius: 16, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', padding: '0' }}>
            <summary style={{ padding: '18px 22px', fontSize: 15, fontWeight: 600, color: 'white', cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              {q}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}><path d="M6 9l6 6 6-6" /></svg>
            </summary>
            <p style={{ padding: '0 22px 18px', margin: 0, fontSize: 14, color: 'rgba(255,255,255,.55)', lineHeight: 1.8 }}>{a}</p>
          </details>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 36 }}>
        <Link href="/pricing" style={{ fontSize: 14, color: '#60A5FA', textDecoration: 'none', fontWeight: 600 }}>
          Xem bảng giá chi tiết →
        </Link>
      </div>
    </section>
  );
}
