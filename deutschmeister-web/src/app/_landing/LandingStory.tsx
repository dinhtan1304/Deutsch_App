/* eslint-disable no-restricted-syntax */
const STORY_ITEMS = [
  {
    emoji: '😫',
    iconBg: 'linear-gradient(135deg, #EF4444, #F97316)',
    iconShadow: '0 4px 20px rgba(239,68,68,.3)',
    cardBg: 'rgba(239,68,68,.04)',
    label: 'Khởi đầu — Nỗi đau thật sự',
    labelColor: '#F87171',
    body: (
      <>
        <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,.7)', lineHeight: 1.85, margin: 0 }}>
          Mình bắt đầu học tiếng Đức từ con số 0 — không biết gì ngoài &quot;Hallo&quot; và &quot;Danke&quot;. Mở sách ra, đập vào mặt là <strong style={{ color: '#F87171' }}>der, die, das</strong> — ba cái giống mà tiếng Việt không hề có. Mình nhớ cái bàn là &quot;der Tisch&quot; nhưng cái ghế lại là &quot;der Stuhl&quot;, còn cái cửa thì &quot;die Tür&quot;. Chẳng có quy luật nào cả.
        </p>
        <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,.7)', lineHeight: 1.85, margin: '14px 0 0' }}>
          Mình dùng Duolingo, Anki, Google Translate — mỗi cái một ít nhưng không cái nào đủ. Duolingo thì không giải thích ngữ pháp cho người Việt. Anki thì quá khô khan. Tìm tài liệu tiếng Việt thì ít ỏi, rời rạc, không có hệ thống.
        </p>
      </>
    ),
  },
  {
    emoji: '💡',
    iconBg: 'linear-gradient(135deg, #F59E0B, #EF4444)',
    iconShadow: '0 4px 20px rgba(245,158,11,.3)',
    cardBg: 'rgba(245,158,11,.04)',
    label: 'Thực tế phũ phàng',
    labelColor: '#FBBF24',
    body: (
      <>
        <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,.7)', lineHeight: 1.85, margin: 0 }}>
          Khi mình chuẩn bị thi Goethe A1, mình mới nhận ra: <strong style={{ color: '#FBBF24' }}>không có công cụ nào tạo đề thi chuẩn format Goethe bằng tiếng Việt</strong>. Muốn luyện Lesen Teil 1? Phải tự tìm đề cũ trên mạng, photocopy, tự chấm. Muốn luyện Schreiben? Viết xong không ai sửa, không biết sai ở đâu.
        </p>
        <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,.7)', lineHeight: 1.85, margin: '14px 0 0' }}>
          Luyện nói thì càng khó hơn — không có bạn học, không dám nói sai, mở miệng ra chỉ nhớ mỗi &quot;Ich heiße...&quot; rồi đứng hình. Mình học một mình, đôi khi nản đến mức muốn bỏ cuộc.
        </p>
      </>
    ),
  },
  {
    emoji: '✨',
    iconBg: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
    iconShadow: '0 4px 20px rgba(99,102,241,.3)',
    cardBg: 'rgba(99,102,241,.04)',
    label: 'Ý tưởng ra đời',
    labelColor: '#A78BFA',
    body: (
      <>
        <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,.7)', lineHeight: 1.85, margin: 0 }}>
          Mình tự hỏi: <em style={{ color: '#C4B5FD' }}>&quot;Nếu có một app mà vừa học từ, vừa chơi game ôn tập, vừa tạo đề thi chuẩn Goethe, lại còn có AI chấm bài viết và nói — tất cả bằng tiếng Việt thì sao?&quot;</em>
        </p>
        <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,.7)', lineHeight: 1.85, margin: '14px 0 0' }}>
          Mình là developer, và mình quyết định tự xây cái mà mình cần. Không phải vì muốn kinh doanh, mà vì thật sự không có công cụ nào phù hợp. Mỗi tính năng trong Deutschmeister đều sinh ra từ một nỗi đau thật: không nhớ nổi giống của danh từ → có Gender Quiz. Viết xong không ai sửa → có AI chấm bài. Học từ xong quên ngay → có SRS nhắc nhở.
        </p>
      </>
    ),
  },
];

export function LandingStory() {
  return (
    <section id="story" style={{ padding: '96px 24px', maxWidth: 860, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 100, background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.3)', fontSize: 12.5, fontWeight: 700, color: '#4ade80', marginBottom: 16 }}>
          CÂU CHUYỆN CỦA CHÚNG TÔI
        </div>
        <h2 className="section-title" style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-1px', marginBottom: 12 }}>
          Từ nỗi đau <span className="gradient-text">đến Deutschmeister</span>
        </h2>
      </div>

      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: 23, top: 0, bottom: 0, width: 2, background: 'linear-gradient(180deg, rgba(99,102,241,.3), rgba(34,197,94,.3), rgba(245,158,11,.3))', borderRadius: 2 }} className="hide-mobile" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          {STORY_ITEMS.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 20 }}>
              <div className="hide-mobile" style={{ width: 48, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: item.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, zIndex: 1, boxShadow: item.iconShadow }}>
                  {item.emoji}
                </div>
              </div>
              <div className="glow-border" style={{ flex: 1, borderRadius: 20, padding: '24px 28px', background: item.cardBg }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: item.labelColor, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                {item.body}
              </div>
            </div>
          ))}

          {/* Final card — Deutschmeister */}
          <div style={{ display: 'flex', gap: 20 }}>
            <div className="hide-mobile" style={{ width: 48, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #22C55E, #14B8A6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, zIndex: 1, boxShadow: '0 4px 20px rgba(34,197,94,.3)' }}>
                {'🚀'}
              </div>
            </div>
            <div style={{ flex: 1, borderRadius: 20, padding: '24px 28px', background: 'rgba(34,197,94,.06)', border: '1px solid rgba(34,197,94,.2)', boxShadow: '0 0 20px rgba(34,197,94,.08)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#4ADE80', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deutschmeister ra đời</div>
              <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,.7)', lineHeight: 1.85, margin: 0 }}>
                Deutschmeister không phải sản phẩm của một công ty lớn. Nó là sản phẩm của <strong style={{ color: '#4ADE80' }}>một người học tiếng Đức, xây cho những người học tiếng Đức</strong>. Mỗi dòng code, mỗi tính năng đều xuất phát từ câu hỏi: &quot;Cái này có giúp mình học tốt hơn không?&quot;
              </p>
              <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,.7)', lineHeight: 1.85, margin: '14px 0 0' }}>
                Mình biết con đường học tiếng Đức rất dài và đôi khi cô đơn. Nhưng mình hy vọng với Deutschmeister, bạn sẽ có một người bạn đồng hành — không hoàn hảo, nhưng luôn ở đó, 24/7, sẵn sàng tạo đề cho bạn luyện, sửa bài cho bạn học, và nhắc bạn ôn từ mỗi ngày.
              </p>
              <div style={{ marginTop: 20, padding: '16px 20px', borderRadius: 14, background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.15)' }}>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,.6)', lineHeight: 1.8, margin: 0, fontStyle: 'italic' }}>
                  &quot;Tiếng Đức khó, nhưng không phải không học được. Chỉ là cần đúng công cụ và đủ kiên nhẫn.&quot;
                </p>
                <p style={{ fontSize: 13, color: '#4ADE80', fontWeight: 700, margin: '10px 0 0' }}>
                  — Yuii, Developer &amp; German Learner
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
