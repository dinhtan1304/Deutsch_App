/**
 * Chiến lược làm bài + Redemittel theo từng Teil, soạn cho B1 Goethe & TELC
 * (cấu trúc mở — thêm provider/level khác bằng cách mở rộng object này).
 *
 * Nội dung tiếng Việt tĩnh (precedent: `b1-content.ts`) — không qua i18n.
 * Cấu trúc Teil phải khớp EXAM_*_DISPLAY trong `@/lib/examConfig`.
 */

export type StrategySkill = 'reading' | 'listening' | 'writing' | 'speaking';

export interface RedemittelGroup {
  /** Nhóm chức năng, vd "Mở thư", "Nêu ý kiến" */
  label: string;
  items: string[];
}

export interface TeilStrategy {
  /** Teil này kiểm tra cái gì */
  goal: string;
  /** Dạng câu hỏi + số câu */
  taskFormat: string;
  /** Phút nên dành cho Teil này */
  timeBudgetMin?: number;
  /** Cách làm theo thứ tự */
  steps: string[];
  /** Bẫy hay gặp */
  traps: string[];
  /** Mẫu câu (chỉ Schreiben/Sprechen) */
  redemittel?: RedemittelGroup[];
}

type LevelStrategies = Partial<Record<StrategySkill, Record<number, TeilStrategy>>>;

export const TEIL_STRATEGIES: Record<string, Record<string, LevelStrategies>> = {
  GOETHE: {
    B1: {
      // ─── Lesen — 5 Teile, 65 phút ─────────────────────────────────────────
      reading: {
        1: {
          goal: 'Hiểu ý chính và chi tiết một bài blog/nhật ký cá nhân.',
          taskFormat: '6 câu Richtig/Falsch',
          timeBudgetMin: 10,
          steps: [
            'Đọc 6 câu hỏi TRƯỚC, gạch chân từ khóa (tên, thời gian, cảm xúc).',
            'Đọc lướt toàn bài một lần để nắm mạch chuyện.',
            'Với mỗi câu, tìm đúng đoạn chứa thông tin rồi so từng ý.',
          ],
          traps: [
            'Câu hỏi diễn đạt lại (Paraphrase) chứ không lặp nguyên văn — đừng bắt từ giống nhau.',
            '"Falsch" khác "không được nhắc tới": Goethe Teil 1 chỉ có R/F, thông tin trái ngược mới là Falsch.',
          ],
        },
        2: {
          goal: 'Hiểu quan điểm, lập luận trong 2 bài báo ngắn.',
          taskFormat: '6 câu trắc nghiệm a/b/c (3 câu mỗi bài)',
          timeBudgetMin: 15,
          steps: [
            'Đọc câu hỏi trước để biết cần tìm gì (ai nói, ý kiến gì).',
            'Đọc kỹ từng đoạn — đáp án thường theo đúng thứ tự đoạn văn.',
            'Loại 2 phương án sai bằng cách tìm điểm mâu thuẫn với bài.',
          ],
          traps: [
            'Cả 3 phương án đều chứa từ có trong bài — chỉ 1 phương án đúng NGHĨA.',
            'Câu hỏi cuối thường hỏi ý toàn bài (Was ist die Hauptaussage?) — đừng chọn theo chi tiết lẻ.',
          ],
        },
        3: {
          goal: 'Tìm nhanh quảng cáo/thông báo phù hợp với nhu cầu từng người.',
          taskFormat: '7 tình huống → 10 Anzeigen (có thể chọn X = không có)',
          timeBudgetMin: 12,
          steps: [
            'Đọc 7 tình huống trước, gạch chân 2 điều kiện then chốt của mỗi người.',
            'Quét tiêu đề các Anzeigen, chỉ đọc kỹ khi tiêu đề khớp.',
            'Mỗi Anzeige chỉ dùng 1 lần — điền chắc chắn trước, khó để sau.',
          ],
          traps: [
            'Luôn có 1 tình huống KHÔNG có Anzeige phù hợp → đáp án X. Đừng gò ép.',
            'Anzeige khớp 1 điều kiện nhưng sai điều kiện thứ 2 (giá, thời gian, địa điểm) — phải khớp CẢ HAI.',
          ],
        },
        4: {
          goal: 'Nhận diện quan điểm đồng ý/phản đối trong các ý kiến độc giả.',
          taskFormat: '7 ý kiến → Ja/Nein (ủng hộ hay phản đối chủ đề)',
          timeBudgetMin: 12,
          steps: [
            'Đọc kỹ câu chủ đề (thường ở đề bài) để biết "Ja" nghĩa là ủng hộ cái gì.',
            'Với mỗi ý kiến, tìm câu thể hiện thái độ (dafür/dagegen) — thường ở đầu hoặc cuối.',
            'Chú ý các từ đảo chiều: aber, trotzdem, allerdings, einerseits… andererseits.',
          ],
          traps: [
            'Người viết nêu ý phản đối trước rồi mới chốt quan điểm thật sau chữ "aber".',
            'Giọng mỉa mai/nghi vấn tu từ dễ đọc nhầm chiều quan điểm.',
          ],
        },
        5: {
          goal: 'Hiểu văn bản quy định (nội quy nhà, hướng dẫn sử dụng).',
          taskFormat: '4 câu trắc nghiệm a/b/c',
          timeBudgetMin: 8,
          steps: [
            'Đọc câu hỏi trước — mỗi câu ứng với 1-2 điều khoản cụ thể.',
            'Tìm đúng mục (số thứ tự, tiêu đề nhỏ) rồi đọc kỹ điều khoản đó.',
          ],
          traps: [
            'Từ vựng hành chính (Vermieter, Kündigungsfrist, haften) — học trước nhóm từ này.',
            'Phân biệt bắt buộc (müssen), được phép (dürfen) và bị cấm (nicht gestattet).',
          ],
        },
      },
      // ─── Hören — 4 Teile, 40 phút ─────────────────────────────────────────
      listening: {
        1: {
          goal: 'Nắm thông tin cốt lõi từ báo cáo/tin radio dài.',
          taskFormat: '10 câu Richtig/Falsch (nghe 2 lần)',
          timeBudgetMin: 12,
          steps: [
            'Tận dụng thời gian đọc đề: gạch chân số liệu, tên riêng trong 10 câu.',
            'Lần nghe 1: trả lời các câu chắc chắn. Lần 2: kiểm tra + điền câu còn lại.',
          ],
          traps: [
            'Số liệu bị sửa lại trong bài nói ("eigentlich 20, aber jetzt nur 15") — lấy số cuối cùng.',
            'Đừng bỏ trống: không bị trừ điểm khi đoán.',
          ],
        },
        2: {
          goal: 'Hiểu thông báo ngắn nơi công cộng (nhà ga, siêu thị, sân bay).',
          taskFormat: '5 câu trắc nghiệm a/b/c (nghe 1 lần)',
          timeBudgetMin: 8,
          steps: [
            'Chỉ nghe 1 LẦN — đọc trước cả câu hỏi lẫn 3 phương án.',
            'Tập trung vào con số, giờ, Gleis/Terminal — ghi nháp ngay khi nghe.',
          ],
          traps: [
            'Thông báo đổi kế hoạch: chuyến tàu chuyển Gleis, giờ bị hoãn — đáp án là thông tin MỚI.',
          ],
        },
        3: {
          goal: 'Ghép người nói với nội dung phù hợp trong hội thoại đời thường.',
          taskFormat: '5 người → 6 lựa chọn (Zuordnung, nghe 1 lần)',
          timeBudgetMin: 8,
          steps: [
            'Đọc trước các lựa chọn, hình dung từ vựng sẽ xuất hiện cho mỗi ý.',
            'Nghe theo thứ tự người nói — chốt ngay sau mỗi người, không chờ cuối bài.',
          ],
          traps: [
            'Người nói nhắc tới NHIỀU chủ đề nhưng chỉ 1 chủ đề là ý chính của họ.',
          ],
        },
        4: {
          goal: 'Theo dõi phỏng vấn dài, phân biệt ý kiến các bên.',
          taskFormat: '7 câu trắc nghiệm a/b/c (nghe 2 lần)',
          timeBudgetMin: 12,
          steps: [
            'Đọc trước 7 câu, đánh dấu câu nào hỏi người phỏng vấn / khách mời.',
            'Câu hỏi theo đúng thứ tự cuộc phỏng vấn — nếu lỡ 1 câu, bỏ qua ngay để bám kịp.',
          ],
          traps: [
            'Hai người trong phỏng vấn có quan điểm khác nhau — chú ý AI nói ý nào.',
          ],
        },
      },
      // ─── Schreiben — 3 Teile, 60 phút ─────────────────────────────────────
      writing: {
        1: {
          goal: 'Viết email thân mật kể chuyện/mời/đề nghị với bạn bè.',
          taskFormat: 'E-Mail ~80 từ, 3 ý bắt buộc (Leitpunkte)',
          timeBudgetMin: 20,
          steps: [
            'Gạch đầu dòng 3 Leitpunkte, mỗi ý viết 2-3 câu.',
            'Đủ khung: chào — mở thư — 3 ý — kết thư — ký tên.',
            'Dành 2-3 phút cuối soát: động từ vị trí 2, đuôi tính từ, dấu câu.',
          ],
          traps: [
            'Thiếu 1 Leitpunkt là mất hẳn 1/3 điểm nội dung — đếm lại trước khi nộp.',
            'Email cho BẠN: dùng du/dich/dir, không dùng Sie.',
          ],
          redemittel: [
            { label: 'Mở thư (thân mật)', items: ['Lieber Max, / Liebe Anna,', 'vielen Dank für deine E-Mail!', 'schön, von dir zu hören!'] },
            { label: 'Kể / đề nghị', items: ['Ich habe eine Idee: …', 'Wie wäre es, wenn wir …?', 'Ich schlage vor, dass …'] },
            { label: 'Kết thư', items: ['Ich freue mich auf deine Antwort.', 'Melde dich bald!', 'Viele Grüße / Liebe Grüße'] },
          ],
        },
        2: {
          goal: 'Nêu và bảo vệ ý kiến về một chủ đề xã hội (bình luận diễn đàn).',
          taskFormat: 'Forumsbeitrag ~80 từ, nêu ý kiến + lý do + ví dụ',
          timeBudgetMin: 25,
          steps: [
            'Chọn NGAY một phía (đồng ý/phản đối) — không cần trung lập.',
            'Khung 4 phần: dẫn đề → ý kiến → 2 lý do (mỗi lý do 1 ví dụ) → kết luận.',
            'Dùng liên từ lập luận: weil, deshalb, außerdem, zum Beispiel.',
          ],
          traps: [
            'Sa đà kể chuyện cá nhân mà quên LẬP LUẬN — mỗi ý phải có "vì sao".',
            'Viết quá dài dễ nhiều lỗi; ~80-100 từ là đủ.',
          ],
          redemittel: [
            { label: 'Nêu ý kiến', items: ['Meiner Meinung nach …', 'Ich bin der Meinung, dass …', 'Ich finde es wichtig, dass …'] },
            { label: 'Lập luận', items: ['Ein wichtiger Grund dafür ist …', 'Außerdem …', 'Ein Beispiel dafür ist …'] },
            { label: 'Kết luận', items: ['Zusammenfassend kann man sagen, dass …', 'Deshalb bin ich überzeugt, dass …'] },
          ],
        },
        3: {
          goal: 'Viết thư trang trọng ngắn (xin lỗi, hủy hẹn, xin thông tin).',
          taskFormat: 'E-Mail trang trọng ~40 từ',
          timeBudgetMin: 15,
          steps: [
            'Xác định người nhận (giáo viên, công ty…) → toàn thư dùng Sie.',
            'Ngắn gọn 3 câu: lý do viết — thông tin chính (xin lỗi/hủy/hỏi) — đề nghị/cảm ơn.',
          ],
          traps: [
            'Trộn du và Sie trong cùng thư — lỗi rất phổ biến, soát lại từng đại từ.',
            'Quên Betreff hoặc chào sai kiểu ("Hallo!" trong thư trang trọng).',
          ],
          redemittel: [
            { label: 'Mở thư (trang trọng)', items: ['Sehr geehrte Frau …, / Sehr geehrter Herr …,', 'Sehr geehrte Damen und Herren,'] },
            { label: 'Nội dung', items: ['Leider kann ich am … nicht kommen, weil …', 'Ich möchte mich für … entschuldigen.', 'Könnten Sie mir bitte mitteilen, ob …?'] },
            { label: 'Kết thư', items: ['Vielen Dank für Ihr Verständnis.', 'Mit freundlichen Grüßen'] },
          ],
        },
      },
      // ─── Sprechen — 3 Teile, ~15 phút ─────────────────────────────────────
      speaking: {
        1: {
          goal: 'Cùng lên kế hoạch một hoạt động chung (gemeinsam etwas planen).',
          taskFormat: 'Hội thoại lập kế hoạch ~3 phút',
          timeBudgetMin: 3,
          steps: [
            'Bám 4 ý: làm gì — khi nào/ở đâu — chuẩn bị gì — chốt hẹn.',
            'Luân phiên: đưa đề xuất → hỏi ý đối phương → phản hồi đề xuất của họ.',
          ],
          traps: [
            'Độc thoại một mình — giám khảo chấm khả năng TƯƠNG TÁC, phải hỏi lại đối phương.',
            'Đồng ý mọi thứ quá nhanh: nên từ chối nhẹ 1 lần rồi đề xuất phương án khác.',
          ],
          redemittel: [
            { label: 'Đề xuất', items: ['Wie wäre es, wenn wir …?', 'Wir könnten doch …', 'Was hältst du davon, … zu …?'] },
            { label: 'Đồng ý / từ chối', items: ['Das ist eine gute Idee!', 'Einverstanden!', 'Das finde ich nicht so gut, weil …', 'Ich würde lieber …'] },
            { label: 'Chốt kế hoạch', items: ['Also, wir treffen uns um … vor …', 'Abgemacht!'] },
          ],
        },
        2: {
          goal: 'Trình bày quan điểm về một chủ đề bằng bài nói ngắn có cấu trúc.',
          taskFormat: 'Präsentation ~3 phút theo 5 slide gợi ý',
          timeBudgetMin: 3,
          steps: [
            'Theo đúng 5 phần: giới thiệu đề tài → kinh nghiệm bản thân → tình hình ở VN/Đức → ưu nhược điểm + ý kiến → kết.',
            'Mỗi phần 2-3 câu, dùng câu chuyển phần rõ ràng.',
          ],
          traps: [
            'Bỏ qua phần "Vor- und Nachteile" — phần này bắt buộc và được chấm riêng.',
            'Học thuộc máy móc: giám khảo nhận ra ngay, hãy nói theo dàn ý.',
          ],
          redemittel: [
            { label: 'Mở bài', items: ['Das Thema meiner Präsentation ist …', 'Ich möchte heute über … sprechen.'] },
            { label: 'Chuyển phần', items: ['Aus meiner eigenen Erfahrung kann ich sagen, dass …', 'In meinem Heimatland …', 'Ein Vorteil ist …, ein Nachteil dagegen …'] },
            { label: 'Kết bài', items: ['Zusammenfassend möchte ich sagen, dass …', 'Danke für Ihre Aufmerksamkeit!'] },
          ],
        },
        3: {
          goal: 'Phản hồi bài trình bày của bạn thi: nhận xét + đặt câu hỏi.',
          taskFormat: 'Feedback + 1 câu hỏi về Präsentation của đối phương',
          timeBudgetMin: 2,
          steps: [
            'Khi đối phương nói: ghi nháp 1 ý thú vị + 1 điều muốn hỏi.',
            'Công thức: cảm ơn → khen 1 ý cụ thể → hỏi 1 câu mở (W-Frage).',
          ],
          traps: [
            'Hỏi câu Ja/Nein quá đơn giản — dùng W-Frage (Warum? Wie? Was denkst du über …?).',
          ],
          redemittel: [
            { label: 'Nhận xét', items: ['Danke für deine Präsentation, sie war sehr interessant.', 'Besonders interessant fand ich, dass …'] },
            { label: 'Đặt câu hỏi', items: ['Ich habe eine Frage: Warum …?', 'Wie ist das in deinem Heimatland?'] },
          ],
        },
      },
    },
  },
  TELC: {
    B1: {
      // ─── Leseverstehen + Sprachbausteine — 5 Teile, 90 phút ───────────────
      reading: {
        1: {
          goal: 'Ghép tiêu đề với đoạn văn ngắn (Globalverstehen).',
          taskFormat: '5 đoạn → 10 tiêu đề (Zuordnung Überschriften)',
          timeBudgetMin: 15,
          steps: [
            'Đọc đoạn TRƯỚC, tự tóm tắt 1 câu, rồi mới tìm tiêu đề khớp.',
            'Gạch bỏ tiêu đề đã dùng để thu hẹp lựa chọn.',
          ],
          traps: [
            'Tiêu đề bẫy chứa đúng từ khóa của đoạn nhưng sai Ý CHÍNH.',
            'Có 5 tiêu đề thừa — đừng cố dùng hết.',
          ],
        },
        2: {
          goal: 'Đọc hiểu chi tiết một bài báo (Detailverstehen).',
          taskFormat: '5 câu trắc nghiệm a/b/c',
          timeBudgetMin: 20,
          steps: [
            'Đọc câu hỏi trước; đáp án xuất hiện theo thứ tự bài.',
            'Định vị đoạn chứa từ khóa rồi so nghĩa từng phương án.',
          ],
          traps: [
            'Phương án dùng từ trong bài nhưng gán sai chủ thể hoặc sai thời điểm.',
          ],
        },
        3: {
          goal: 'Tìm quảng cáo phù hợp với 10 tình huống (Selektives Verstehen).',
          taskFormat: '10 tình huống → 12 Anzeigen, có tình huống không có đáp án (X)',
          timeBudgetMin: 15,
          steps: [
            'Gạch chân 2 điều kiện của mỗi tình huống trước khi quét Anzeigen.',
            'Làm chắc trước, tình huống mơ hồ để cuối; nhớ có thể là X.',
          ],
          traps: [
            'Anzeige gần khớp nhưng lệch 1 chi tiết (cuối tuần vs ngày thường, miễn phí vs có phí).',
          ],
        },
        4: {
          goal: 'Ngữ pháp trong ngữ cảnh: điền vào chỗ trống bức thư.',
          taskFormat: 'Sprachbausteine 1 — 10 chỗ trống, mỗi chỗ 3 phương án a/b/c',
          timeBudgetMin: 10,
          steps: [
            'Đọc cả câu trước khi chọn — chỗ trống kiểm tra ngữ pháp (giới từ, đại từ, liên từ, đuôi tính từ).',
            'Xác định dạng cần điền: sau Präposition nào thì Dativ/Akkusativ?',
          ],
          traps: [
            'Liên từ đổi vị trí động từ: weil/dass đẩy động từ về cuối, deshalb đảo chủ ngữ.',
          ],
        },
        5: {
          goal: 'Từ vựng trong ngữ cảnh: chọn từ đúng từ danh sách.',
          taskFormat: 'Sprachbausteine 2 — 10 chỗ trống, chọn từ 15 từ cho sẵn',
          timeBudgetMin: 10,
          steps: [
            'Phân loại nhanh 15 từ theo từ loại (danh/động/tính/trạng từ).',
            'Chỗ trống cần từ loại gì thì chỉ thử nhóm đó; gạch từ đã dùng.',
          ],
          traps: [
            'Có 5 từ thừa; 2 từ cùng từ loại nghĩa gần nhau — thử cả 2 vào câu để chọn.',
          ],
        },
      },
      // ─── Hörverstehen — 3 Teile, ~30 phút ─────────────────────────────────
      listening: {
        1: {
          goal: 'Hiểu ý chính các thông báo/tin nhắn ngắn.',
          taskFormat: '10 thông báo → trắc nghiệm (nghe 1 lần)',
          timeBudgetMin: 10,
          steps: [
            'Nghe 1 LẦN duy nhất — đọc trước phương án, tập trung tuyệt đối.',
            'Chốt đáp án ngay sau mỗi thông báo, không quay lại nghĩ tiếp.',
          ],
          traps: [
            'Mỗi đoạn rất ngắn (~20 giây) — lỡ là mất, bỏ qua ngay để bám đoạn sau.',
          ],
        },
        2: {
          goal: 'Nắm thông tin chính từ các bản tin radio.',
          taskFormat: '5 bản tin → trắc nghiệm 2 câu/bài (nghe 1 lần)',
          timeBudgetMin: 10,
          steps: [
            'Đọc trước cả 10 câu để biết nội dung sẽ nghe.',
            'Ghi nháp số liệu/tên riêng ngay khi nghe.',
          ],
          traps: [
            'Câu hỏi hỏi ý CHÍNH nhưng bản tin nhắc nhiều chi tiết phụ hấp dẫn.',
          ],
        },
        3: {
          goal: 'Theo dõi độc thoại dài (kể chuyện, thuyết trình).',
          taskFormat: '7 câu Richtig/Falsch (nghe 2 lần)',
          timeBudgetMin: 10,
          steps: [
            'Lần 1 nghe nắm mạch + trả lời câu dễ; lần 2 kiểm tra và điền nốt.',
            'Câu hỏi theo thứ tự bài nói.',
          ],
          traps: [
            'Người nói tự đính chính ("nein, das war ein Jahr später") — lấy thông tin sau cùng.',
          ],
        },
      },
      // ─── Schriftlicher Ausdruck — 1 Teil, 30 phút ─────────────────────────
      writing: {
        1: {
          goal: 'Viết thư/email trả lời tình huống, xử lý đủ các Leitpunkte.',
          taskFormat: '1 bức thư ~80+ từ, 4 Leitpunkte (chọn 3)',
          timeBudgetMin: 30,
          steps: [
            'Đọc kỹ tình huống: viết cho AI (thân mật hay trang trọng?) và để làm gì.',
            'Chọn 3 trong 4 Leitpunkte, mỗi ý 2-3 câu.',
            'Khung đủ: Betreff/chào — mở — 3 ý — kết — ký. Dành 5 phút soát lỗi.',
          ],
          traps: [
            'Sai register (du vs Sie) bị trừ nặng ở tiêu chí giao tiếp.',
            'Viết đủ ý nhưng không LIÊN KẾT — dùng deshalb, außerdem, trotzdem để nối.',
          ],
          redemittel: [
            { label: 'Mở thư trang trọng', items: ['Sehr geehrte Damen und Herren,', 'ich habe Ihre Anzeige gelesen und …', 'ich schreibe Ihnen, weil …'] },
            { label: 'Hỏi / yêu cầu', items: ['Könnten Sie mir bitte mitteilen, …?', 'Ich hätte noch eine Frage: …', 'Ich würde gern wissen, ob …'] },
            { label: 'Kết thư', items: ['Ich freue mich auf Ihre Antwort.', 'Vielen Dank im Voraus.', 'Mit freundlichen Grüßen'] },
          ],
        },
      },
      // ─── Mündliche Prüfung — 3 Teile ──────────────────────────────────────
      speaking: {
        1: {
          goal: 'Làm quen và trò chuyện xã giao (Kontaktaufnahme).',
          taskFormat: 'Hội thoại giới thiệu bản thân ~2-3 phút',
          timeBudgetMin: 3,
          steps: [
            'Chuẩn bị sẵn các chủ đề: tên, quê, gia đình, công việc, sở thích, học tiếng Đức.',
            'Hỏi lại đối phương những câu tương tự — hội thoại 2 chiều.',
          ],
          traps: [
            'Trả lời cụt (1 câu) — mỗi ý nên nói 2-3 câu rồi chuyền lượt.',
          ],
          redemittel: [
            { label: 'Giới thiệu', items: ['Darf ich mich vorstellen? Ich heiße …', 'Ich komme aus … und wohne seit … in …', 'In meiner Freizeit … ich gern.'] },
            { label: 'Hỏi lại', items: ['Und du? / Und Sie?', 'Woher kommst du?', 'Was machst du beruflich?'] },
          ],
        },
        2: {
          goal: 'Trao đổi quan điểm về một chủ đề dựa trên bài đọc ngắn.',
          taskFormat: 'Gespräch über ein Thema ~5 phút',
          timeBudgetMin: 5,
          steps: [
            'Tóm tắt ngắn thông tin trong thẻ đề của mình cho đối phương.',
            'Nêu ý kiến + lý do, rồi hỏi ý kiến đối phương và PHẢN HỒI ý họ nói.',
          ],
          traps: [
            'Chỉ đọc lại thẻ đề mà không nêu ý kiến riêng.',
            'Không phản hồi ý đối phương — tiêu chí tương tác chiếm điểm lớn.',
          ],
          redemittel: [
            { label: 'Tóm tắt + nêu ý kiến', items: ['In meinem Text geht es um …', 'Ich finde das Thema wichtig, weil …', 'Meiner Meinung nach …'] },
            { label: 'Phản hồi', items: ['Da stimme ich dir zu.', 'Das sehe ich anders, denn …', 'Interessant! Bei uns ist das ähnlich/anders.'] },
          ],
        },
        3: {
          goal: 'Cùng nhau lập kế hoạch giải quyết một nhiệm vụ chung.',
          taskFormat: 'Gemeinsam etwas planen ~5 phút',
          timeBudgetMin: 5,
          steps: [
            'Liệt kê nhanh các việc cần bàn: thời gian, địa điểm, phân công, quà/đồ mang theo.',
            'Mỗi đề xuất kèm lý do; hỏi và phản hồi đề xuất của đối phương; CHỐT kết quả cuối.',
          ],
          traps: [
            'Hết giờ mà chưa chốt kế hoạch — luôn kết bằng tóm tắt các quyết định.',
          ],
          redemittel: [
            { label: 'Đề xuất + phân công', items: ['Ich schlage vor, dass wir …', 'Könntest du …? Dann kümmere ich mich um …', 'Wollen wir …?'] },
            { label: 'Chốt', items: ['Gut, dann machen wir es so: …', 'Also, du bringst … mit und ich …'] },
          ],
        },
      },
    },
  },
};

/** Tra chiến lược 1 Teil; null nếu chưa soạn cho provider/level này. */
export function getTeilStrategy(
  examType: string,
  cefrLevel: string,
  skill: StrategySkill,
  teilNumber: number,
): TeilStrategy | null {
  return TEIL_STRATEGIES[examType]?.[cefrLevel]?.[skill]?.[teilNumber] ?? null;
}

/** Gộp toàn bộ Redemittel của 1 kỹ năng (dùng cho panel tra cứu ở luyện tự do). */
export function getRedemittelForSkill(
  examType: string,
  cefrLevel: string,
  skill: StrategySkill,
): RedemittelGroup[] {
  const teile = TEIL_STRATEGIES[examType]?.[cefrLevel]?.[skill];
  if (!teile) return [];
  const groups: RedemittelGroup[] = [];
  for (const teil of Object.values(teile)) {
    for (const g of teil.redemittel ?? []) {
      const existing = groups.find((x) => x.label === g.label);
      if (existing) {
        existing.items.push(...g.items.filter((i) => !existing.items.includes(i)));
      } else {
        groups.push({ label: g.label, items: [...g.items] });
      }
    }
  }
  return groups;
}
