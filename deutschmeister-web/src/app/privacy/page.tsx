import Link from 'next/link';
/* eslint-disable no-restricted-syntax */

const LAST_UPDATED = '27/03/2026';

const textStyle = { fontSize: 14.5, color: 'rgba(255,255,255,.6)', lineHeight: 1.85 as const };
const pStyle = { ...textStyle, margin: '0 0 10px' };
const ulStyle = { ...textStyle, paddingLeft: 20, margin: '10px 0', display: 'flex' as const, flexDirection: 'column' as const, gap: 6, listStyle: 'disc' as const };
const liStyle = { lineHeight: 1.8 };
const h2Style = { fontSize: 18, fontWeight: 800 as const, color: 'white', marginBottom: 14 };
const h3Style = { fontSize: 15, fontWeight: 700 as const, color: 'rgba(255,255,255,.85)', marginBottom: 8, marginTop: 16 };

export default function PrivacyPage() {
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: '#0a0f1e', color: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid rgba(255,255,255,.06)',
        background: 'rgba(10,15,30,.95)',
        backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" width={32} height={32} alt="Deutschmeister" style={{ borderRadius: 8 }} />
            <span style={{ fontWeight: 800, fontSize: 15, color: 'white' }}>Deutschmeister</span>
          </Link>
          <Link href="/" style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', textDecoration: 'none' }}>
            Trang chủ
          </Link>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 8, letterSpacing: '-0.5px' }}>
            Chính sách bảo mật
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)' }}>
            Cập nhật lần cuối: {LAST_UPDATED}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>

          {/* 1 */}
          <div>
            <h2 style={h2Style}>1. Giới thiệu</h2>
            <p style={pStyle}>
              Deutschmeister (&quot;chúng tôi&quot;, &quot;của chúng tôi&quot;) cam kết bảo vệ quyền riêng tư của bạn. Chính sách bảo mật này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn khi bạn sử dụng nền tảng học tiếng Đức Deutschmeister.
            </p>
            <p style={pStyle}>
              Chúng tôi là một dự án cá nhân, phát triển bởi một người học tiếng Đức tại Việt Nam. Chúng tôi không phải công ty lớn và không có mục đích khai thác dữ liệu người dùng.
            </p>
          </div>

          {/* 2 */}
          <div>
            <h2 style={h2Style}>2. Thông tin chúng tôi thu thập</h2>

            <h3 style={h3Style}>2.1. Thông tin tài khoản</h3>
            <ul style={ulStyle}>
              <li style={liStyle}>Họ tên (nếu bạn cung cấp)</li>
              <li style={liStyle}>Địa chỉ email</li>
              <li style={liStyle}>Mật khẩu (được mã hoá bằng bcrypt, chúng tôi không thể đọc được)</li>
              <li style={liStyle}>Ảnh đại diện (nếu bạn cung cấp)</li>
            </ul>

            <h3 style={h3Style}>2.2. Thông tin học tập</h3>
            <ul style={ulStyle}>
              <li style={liStyle}>Từ vựng đã học, tiến độ học tập, điểm số bài thi</li>
              <li style={liStyle}>Lịch sử chơi game, bài viết, bài nói</li>
              <li style={liStyle}>Thiết lập cá nhân: trình độ, mục tiêu học hàng ngày</li>
            </ul>

            <h3 style={h3Style}>2.3. Thông tin đăng nhập bằng mạng xã hội</h3>
            <p style={pStyle}>
              Nếu bạn đăng nhập bằng Google hoặc Facebook, chúng tôi chỉ nhận được: tên, email và ảnh đại diện từ nhà cung cấp OAuth. Chúng tôi <strong>không</strong> truy cập danh bạ, bạn bè, hoặc bất kỳ dữ liệu nào khác.
            </p>

            <h3 style={h3Style}>2.4. Dữ liệu kỹ thuật</h3>
            <ul style={ulStyle}>
              <li style={liStyle}>Cookie: chỉ sử dụng httpOnly cookie cho refresh token xác thực</li>
              <li style={liStyle}>Không sử dụng cookie theo dõi (tracking cookies)</li>
              <li style={liStyle}>Không sử dụng Google Analytics hay bất kỳ dịch vụ tracking nào</li>
            </ul>
          </div>

          {/* 3 */}
          <div>
            <h2 style={h2Style}>3. Cách chúng tôi sử dụng thông tin</h2>
            <ul style={ulStyle}>
              <li style={liStyle}>Cung cấp và cải thiện dịch vụ học tiếng Đức</li>
              <li style={liStyle}>Cá nhân hoá trải nghiệm học tập (đề xuất bài học, mục tiêu)</li>
              <li style={liStyle}>Gửi email xác nhận tài khoản và nhắc nhở học tập (có thể tắt trong Cài đặt)</li>
              <li style={liStyle}>Bảo mật tài khoản của bạn</li>
            </ul>
            <p style={pStyle}>
              Chúng tôi <strong>không bán, cho thuê, hay chia sẻ</strong> thông tin cá nhân của bạn với bất kỳ bên thứ ba nào vì mục đích quảng cáo hay thương mại.
            </p>
          </div>

          {/* 4 */}
          <div>
            <h2 style={h2Style}>4. Gemini AI và dữ liệu học tập</h2>
            <p style={pStyle}>
              Deutschmeister sử dụng Google Gemini AI để tạo đề thi, chấm bài viết và bài nói. Khi bạn sử dụng các tính năng AI:
            </p>
            <ul style={ulStyle}>
              <li style={liStyle}>Bài viết và bài nói của bạn được gửi đến Google Gemini API để xử lý</li>
              <li style={liStyle}>Dữ liệu này được xử lý theo chính sách bảo mật của Google Cloud</li>
              <li style={liStyle}>Chúng tôi không lưu trữ âm thanh ghi âm — chỉ lưu bản transcript (văn bản)</li>
              <li style={liStyle}>Kết quả chấm điểm được lưu lại để bạn có thể xem lại</li>
            </ul>
          </div>

          {/* 5 */}
          <div>
            <h2 style={h2Style}>5. Bảo mật dữ liệu</h2>
            <ul style={ulStyle}>
              <li style={liStyle}>Mật khẩu được mã hoá bằng bcrypt (không thể giải mã ngược)</li>
              <li style={liStyle}>Access token lưu trong bộ nhớ (không lưu localStorage)</li>
              <li style={liStyle}>Refresh token lưu trong httpOnly cookie (chống XSS)</li>
              <li style={liStyle}>Tất cả kết nối sử dụng HTTPS</li>
              <li style={liStyle}>Cơ sở dữ liệu PostgreSQL được bảo vệ bởi nhà cung cấp hosting</li>
            </ul>
          </div>

          {/* 6 */}
          <div>
            <h2 style={h2Style}>6. Quyền của bạn</h2>
            <p style={pStyle}>Bạn có quyền:</p>
            <ul style={ulStyle}>
              <li style={liStyle}><strong>Xem</strong> — Xem toàn bộ thông tin cá nhân của bạn trong trang Cài đặt</li>
              <li style={liStyle}><strong>Sửa</strong> — Cập nhật tên, ảnh đại diện, mật khẩu bất kỳ lúc nào</li>
              <li style={liStyle}><strong>Xoá</strong> — Yêu cầu xoá tài khoản và toàn bộ dữ liệu (liên hệ qua email)</li>
              <li style={liStyle}><strong>Xuất</strong> — Yêu cầu xuất dữ liệu học tập của bạn</li>
              <li style={liStyle}><strong>Huỷ email</strong> — Tắt email nhắc nhở trong Cài đặt</li>
            </ul>
          </div>

          {/* 7 */}
          <div>
            <h2 style={h2Style}>7. Đối tượng sử dụng</h2>
            <p style={pStyle}>
              Deutschmeister dành cho người từ 13 tuổi trở lên. Chúng tôi không có chủ đích thu thập thông tin của trẻ em dưới 13 tuổi. Nếu bạn là phụ huynh và phát hiện con em mình đã đăng ký, vui lòng liên hệ để chúng tôi xoá tài khoản.
            </p>
          </div>

          {/* 8 */}
          <div>
            <h2 style={h2Style}>8. Thay đổi chính sách</h2>
            <p style={pStyle}>
              Chúng tôi có thể cập nhật chính sách này theo thời gian. Mọi thay đổi sẽ được thông báo trên trang web. Việc bạn tiếp tục sử dụng dịch vụ sau khi cập nhật đồng nghĩa với việc bạn đồng ý với chính sách mới.
            </p>
          </div>

          {/* 9 */}
          <div>
            <h2 style={h2Style}>9. Liên hệ</h2>
            <p style={pStyle}>
              Nếu bạn có bất kỳ câu hỏi nào về chính sách bảo mật, vui lòng liên hệ:
            </p>
            <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(99,102,241,.06)', border: '1px solid rgba(99,102,241,.15)', marginTop: 8 }}>
              <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,.7)' }}>
                Email: <strong style={{ color: '#A78BFA' }}>support@deutschmeister.vn</strong>
              </p>
            </div>
          </div>

        </div>

        {/* Back link */}
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', gap: 24 }}>
          <Link href="/" style={{ fontSize: 14, color: '#A78BFA', textDecoration: 'none', fontWeight: 600 }}>
            Quay lại trang chủ
          </Link>
          <Link href="/terms" style={{ fontSize: 14, color: 'rgba(255,255,255,.4)', textDecoration: 'none', fontWeight: 500 }}>
            Điều khoản sử dụng
          </Link>
        </div>
      </main>
    </div>
  );
}
