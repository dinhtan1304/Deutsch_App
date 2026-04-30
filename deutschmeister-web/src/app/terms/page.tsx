import Link from 'next/link';
/* eslint-disable no-restricted-syntax */

const LAST_UPDATED = '27/03/2026';

const textStyle = { fontSize: 14.5, color: 'rgba(255,255,255,.6)', lineHeight: 1.85 as const };
const pStyle = { ...textStyle, margin: '0 0 10px' };
const ulStyle = { ...textStyle, paddingLeft: 20, margin: '10px 0', display: 'flex' as const, flexDirection: 'column' as const, gap: 6, listStyle: 'disc' as const };
const liStyle = { lineHeight: 1.8 };
const h2Style = { fontSize: 18, fontWeight: 800 as const, color: 'white', marginBottom: 14 };
const h3Style = { fontSize: 15, fontWeight: 700 as const, color: 'rgba(255,255,255,.85)', marginBottom: 8, marginTop: 16 };

export default function TermsPage() {
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
            Điều khoản sử dụng
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)' }}>
            Cập nhật lần cuối: {LAST_UPDATED}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>

          {/* 1 */}
          <div>
            <h2 style={h2Style}>1. Chấp nhận điều khoản</h2>
            <p style={pStyle}>
              Khi sử dụng Deutschmeister, bạn đồng ý tuân thủ các điều khoản này. Nếu bạn không đồng ý, vui lòng không sử dụng dịch vụ.
            </p>
            <p style={pStyle}>
              Deutschmeister là nền tảng học tiếng Đức trực tuyến miễn phí, phát triển bởi cá nhân tại Việt Nam. Đây không phải sản phẩm của Viện Goethe hay TELC — chúng tôi chỉ mô phỏng format đề thi để hỗ trợ việc luyện tập.
            </p>
          </div>

          {/* 2 */}
          <div>
            <h2 style={h2Style}>2. Tài khoản người dùng</h2>
            <ul style={ulStyle}>
              <li style={liStyle}>Bạn phải cung cấp thông tin chính xác khi đăng ký</li>
              <li style={liStyle}>Bạn chịu trách nhiệm bảo mật tài khoản của mình (mật khẩu, thiết bị)</li>
              <li style={liStyle}>Mỗi người chỉ nên có một tài khoản</li>
              <li style={liStyle}>Bạn phải từ 13 tuổi trở lên để sử dụng dịch vụ</li>
              <li style={liStyle}>Chúng tôi có quyền tạm khoá hoặc xoá tài khoản vi phạm điều khoản</li>
            </ul>
          </div>

          {/* 3 */}
          <div>
            <h2 style={h2Style}>3. Nội dung và sở hữu trí tuệ</h2>

            <h3 style={h3Style}>3.1. Nội dung của Deutschmeister</h3>
            <p style={pStyle}>
              Tất cả nội dung trên Deutschmeister (từ vựng, bài tập, giao diện, mã nguồn) thuộc quyền sở hữu của Deutschmeister. Bạn không được sao chép, phân phối hoặc sử dụng cho mục đích thương mại mà không có sự đồng ý.
            </p>

            <h3 style={h3Style}>3.2. Nội dung AI tạo ra</h3>
            <p style={pStyle}>
              Bài thi, bài đọc, câu hỏi được tạo bởi Google Gemini AI. Nội dung này được tạo tự động và có thể không hoàn hảo 100%. Chúng tôi không đảm bảo tính chính xác tuyệt đối của nội dung AI.
            </p>

            <h3 style={h3Style}>3.3. Nội dung của bạn</h3>
            <p style={pStyle}>
              Bài viết, bài nói, từ vựng cá nhân mà bạn tạo thuộc về bạn. Khi gửi bài lên hệ thống, bạn cho phép chúng tôi xử lý (gửi đến AI để chấm điểm) và lưu trữ để bạn xem lại.
            </p>
          </div>

          {/* 4 */}
          <div>
            <h2 style={h2Style}>4. Sử dụng hợp lý</h2>
            <p style={pStyle}>Bạn đồng ý không:</p>
            <ul style={ulStyle}>
              <li style={liStyle}>Sử dụng bot, script tự động để spam hệ thống</li>
              <li style={liStyle}>Cố gắng xâm nhập, tấn công hoặc khai thác lỗ hổng bảo mật</li>
              <li style={liStyle}>Giả mạo người khác hoặc tạo nhiều tài khoản ảo</li>
              <li style={liStyle}>Sử dụng dịch vụ cho mục đích bất hợp pháp</li>
              <li style={liStyle}>Sao chép đề thi để bán lại hoặc sử dụng thương mại</li>
            </ul>
          </div>

          {/* 5 */}
          <div>
            <h2 style={h2Style}>5. Dịch vụ miễn phí và giới hạn</h2>
            <p style={pStyle}>
              Deutschmeister hiện tại cung cấp miễn phí toàn bộ tính năng. Tuy nhiên:
            </p>
            <ul style={ulStyle}>
              <li style={liStyle}>Các tính năng AI (tạo đề, chấm bài) có giới hạn số lượt sử dụng mỗi ngày để kiểm soát chi phí API</li>
              <li style={liStyle}>Chúng tôi có thể thay đổi giới hạn hoặc giới thiệu gói trả phí trong tương lai, với thông báo trước</li>
              <li style={liStyle}>Dịch vụ có thể gián đoạn do bảo trì, nâng cấp hoặc sự cố kỹ thuật</li>
            </ul>
          </div>

          {/* 6 */}
          <div>
            <h2 style={h2Style}>6. Từ chối trách nhiệm</h2>
            <p style={pStyle}>
              Deutschmeister được cung cấp &quot;nguyên trạng&quot; (as-is). Chúng tôi cố gắng đảm bảo chất lượng nhưng không đảm bảo:
            </p>
            <ul style={ulStyle}>
              <li style={liStyle}>Nội dung học tập hoàn toàn chính xác 100% (đặc biệt nội dung AI tạo)</li>
              <li style={liStyle}>Dịch vụ hoạt động liên tục không gián đoạn</li>
              <li style={liStyle}>Kết quả thi thử tương ứng với kết quả thi thật</li>
              <li style={liStyle}>Deutschmeister <strong>không phải</strong> cơ quan cấp chứng chỉ Goethe/TELC chính thức</li>
            </ul>
            <p style={pStyle}>
              Việc học tiếng Đức và kết quả thi phụ thuộc vào nỗ lực cá nhân của bạn. Deutschmeister là công cụ hỗ trợ, không phải sự đảm bảo thành công.
            </p>
          </div>

          {/* 7 */}
          <div>
            <h2 style={h2Style}>7. Quyền riêng tư</h2>
            <p style={pStyle}>
              Việc thu thập và xử lý dữ liệu cá nhân được chỉ định bởi{' '}
              <Link href="/privacy" style={{ color: '#A78BFA', textDecoration: 'underline' }}>Chính sách bảo mật</Link>{' '}
              của chúng tôi, là một phần không tách rời của các điều khoản này.
            </p>
          </div>

          {/* 8 */}
          <div>
            <h2 style={h2Style}>8. Chấm dứt</h2>
            <ul style={ulStyle}>
              <li style={liStyle}>Bạn có thể ngừng sử dụng dịch vụ bất kỳ lúc nào</li>
              <li style={liStyle}>Bạn có thể yêu cầu xoá tài khoản qua email</li>
              <li style={liStyle}>Chúng tôi có quyền chấm dứt tài khoản vi phạm điều khoản</li>
              <li style={liStyle}>Khi tài khoản bị xoá, dữ liệu học tập sẽ bị xoá vĩnh viễn</li>
            </ul>
          </div>

          {/* 9 */}
          <div>
            <h2 style={h2Style}>9. Thay đổi điều khoản</h2>
            <p style={pStyle}>
              Chúng tôi có thể cập nhật điều khoản này. Thay đổi sẽ được thông báo trên trang web. Việc tiếp tục sử dụng dịch vụ sau khi cập nhật đồng nghĩa với việc bạn đồng ý với điều khoản mới.
            </p>
          </div>

          {/* 10 */}
          <div>
            <h2 style={h2Style}>10. Liên hệ</h2>
            <p style={pStyle}>
              Nếu bạn có câu hỏi về điều khoản sử dụng, vui lòng liên hệ:
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
          <Link href="/privacy" style={{ fontSize: 14, color: 'rgba(255,255,255,.4)', textDecoration: 'none', fontWeight: 500 }}>
            Chính sách bảo mật
          </Link>
        </div>
      </main>
    </div>
  );
}
