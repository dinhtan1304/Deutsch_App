/**
 * Nội dung cẩm nang B1 (Goethe & TELC) tổng hợp từ 3 landing page
 * deutschtiger.com (/thi-b1-goethe, /thi-b1-telc, /luyen-thi-b1).
 *
 * Tách riêng để dễ chỉnh sửa text mà không phải đụng JSX components.
 */

import type { GradientKey } from '@/lib/tokens';

// ─── 1. Choose Exam (Goethe vs TELC) ──────────────────────────────────────────

export interface ExamSummary {
  id: 'goethe' | 'telc';
  name: string;
  shortName: string;
  description: string;
  bullets: string[];
  gradient: GradientKey;
  scrollAnchor: string;
}

export const examSummaries: ExamSummary[] = [
  {
    id: 'goethe',
    name: 'Goethe-Zertifikat B1',
    shortName: 'Goethe',
    description:
      'Chứng chỉ tiếng Đức quốc tế do Viện Goethe cấp. Được công nhận toàn cầu, thường dùng cho visa định cư, nhập tịch và học nghề tại Đức. Cấu trúc gồm 4 kỹ năng độc lập.',
    bullets: [
      'Lesen · Hören · Schreiben · Sprechen',
      'Thời gian: ~3 tiếng 20 phút',
      'Điểm đạt: 60/100 mỗi kỹ năng',
      'Lệ phí tại Việt Nam: ~2.0–2.5 triệu',
    ],
    gradient: 'reading',
    scrollAnchor: 'cau-truc-de',
  },
  {
    id: 'telc',
    name: 'TELC Deutsch B1',
    shortName: 'TELC',
    description:
      'Chứng chỉ TELC phổ biến tại Đức và châu Âu. Được chấp nhận cho Niederlassungserlaubnis (thường trú), Einbürgerung (nhập tịch) và visa đoàn tụ gia đình. Có phần Sprachbausteine đặc trưng mà Goethe không có.',
    bullets: [
      'A-RAP: Lesen · Hören · Sprachbausteine · Schreiben',
      'Mündliche Prüfung: Sprechen nhóm 3–4 người',
      'Điểm đạt: 60% tổng điểm (≥ 120/200)',
      'Lệ phí tại Việt Nam: ~1.8–2.2 triệu',
    ],
    gradient: 'examWriting',
    scrollAnchor: 'cau-truc-de',
  },
];

export interface ComparisonRow {
  criterion: string;
  goethe: string;
  telc: string;
}

export const comparisonRows: ComparisonRow[] = [
  { criterion: 'Sprachbausteine', goethe: '✗ Không có', telc: '✓ Có (2 phần, 20 câu)' },
  { criterion: 'Sprechen', goethe: 'Thi theo cặp', telc: 'Thi theo nhóm 3–4 người' },
  { criterion: 'Thời gian Schreiben', goethe: '60 phút (2 đề)', telc: '30 phút (1 đề)' },
  { criterion: 'Điểm đạt', goethe: '60/100 mỗi kỹ năng', telc: '60% tổng điểm' },
  { criterion: 'Lệ phí (VN)', goethe: '~2.0–2.5 triệu', telc: '~1.8–2.2 triệu' },
  { criterion: 'Dùng cho Einbürgerung', goethe: '✓ Được công nhận', telc: '✓ Được công nhận' },
];

// ─── 2. Exam Structure — per-skill breakdown for both exams ──────────────────

export type SkillKey = 'lesen' | 'hoeren' | 'sprachbausteine' | 'schreiben' | 'sprechen';

export interface SkillDetail {
  key: SkillKey;
  title: string;
  titleDe: string;
  duration: string;
  points?: string;
  summary: string;
  parts: string;
  tip: string;
  practiceHref: string;
  gradient: GradientKey;
}

export const examStructureGoethe: SkillDetail[] = [
  {
    key: 'lesen',
    title: 'Lesen',
    titleDe: 'Đọc hiểu',
    duration: '65 phút',
    points: '100 điểm',
    summary:
      '5 phần: chọn đúng/sai/không có thông tin, điền từ, đọc hiểu quảng cáo, bài báo, thư từ.',
    parts:
      'Teil 1 (~5 câu): đọc thông báo ngắn, chọn thông tin phù hợp. Teil 2 (~5 câu): chọn đúng/sai/không có. Teil 3 (~10 câu): điền từ vào đoạn văn. Teil 4 (~5 câu): ghép tiêu đề với đoạn. Teil 5 (~5 câu): đọc thư cá nhân, trả lời câu hỏi.',
    tip: 'Đọc kỹ câu hỏi trước, gạch chân từ khóa, loại trừ đáp án sai.',
    practiceHref: '/practice-test/reading/exam',
    gradient: 'reading',
  },
  {
    key: 'hoeren',
    title: 'Hören',
    titleDe: 'Nghe hiểu',
    duration: '40 phút',
    points: '100 điểm',
    summary: '4 phần: hội thoại hàng ngày, thông báo, cuộc phỏng vấn, tin tức.',
    parts:
      'Teil 1 (~6 hội thoại ngắn): chọn đúng/sai. Teil 2 (~5 thông báo): chọn thông tin đúng. Teil 3 (phỏng vấn dài): trả lời câu hỏi đúng/sai. Teil 4 (tin tức): điền thông tin vào biểu mẫu.',
    tip: 'Đọc câu hỏi trong thời gian cho phép, chú ý từ phủ định và số liệu.',
    practiceHref: '/practice-test/listening/exam',
    gradient: 'listening',
  },
  {
    key: 'schreiben',
    title: 'Schreiben',
    titleDe: 'Viết',
    duration: '60 phút',
    points: '100 điểm',
    summary:
      '2 phần: viết thư/email phản hồi (Teil 1) và bài luận ngắn về chủ đề quen thuộc (Teil 2).',
    parts:
      'Teil 1: Viết thư/email phản hồi bạn bè hoặc diễn đàn (~80 từ). Cần trả lời đủ các yêu cầu. Teil 2: Bình luận về một câu phát biểu (pro/contra, ~80 từ).',
    tip: 'Phân bổ 25 phút cho Teil 1 và 35 phút cho Teil 2. Dùng cấu trúc Einleitung–Hauptteil–Schluss.',
    practiceHref: '/practice-test/writing/exam',
    gradient: 'writing',
  },
  {
    key: 'sprechen',
    title: 'Sprechen',
    titleDe: 'Nói',
    duration: '15 phút',
    points: '100 điểm',
    summary: '3 phần: tự giới thiệu, thảo luận chủ đề (với bạn thi), lập kế hoạch chung.',
    parts:
      'Teil 1: Tự giới thiệu (~2 phút). Teil 2: Thảo luận về chủ đề ngẫu nhiên (~4 phút). Teil 3: Lên kế hoạch chung với bạn thi (~4 phút).',
    tip: 'Dùng liên từ (weil, obwohl, damit), đặt câu hỏi cho đối tác, không im lặng quá 5 giây.',
    practiceHref: '/practice-test/speaking/exam',
    gradient: 'speaking',
  },
];

export const examStructureTelc: SkillDetail[] = [
  {
    key: 'lesen',
    title: 'Lesen',
    titleDe: 'Đọc hiểu',
    duration: '~25 phút',
    summary:
      '3 phần: chọn đúng/sai/không có thông tin, ghép tiêu đề, điền từ vào đoạn văn.',
    parts:
      'Phần 1 (~10 câu): Đọc email/thư ngắn, chọn đúng/sai/không có thông tin. Phần 2 (~5 câu): Đọc bài báo, ghép đoạn với tiêu đề. Phần 3 (~10 câu): Điền từ thích hợp vào chỗ trống.',
    tip: 'Đọc qua nhanh để nắm ý chính, sau đó đọc kỹ từng câu hỏi. Chú ý từ phủ định như "nicht", "kein", "niemand".',
    practiceHref: '/practice-test/reading/exam',
    gradient: 'reading',
  },
  {
    key: 'hoeren',
    title: 'Hören',
    titleDe: 'Nghe hiểu',
    duration: '~30 phút',
    summary: '3 phần: hội thoại hàng ngày, thông báo công cộng, cuộc trò chuyện dài.',
    parts:
      'Phần 1 (~6 hội thoại ngắn): Chọn đúng/sai. Phần 2 (~6 thông báo): Chọn thông tin đúng từ 3 đáp án. Phần 3 (1 cuộc trò chuyện dài): Điền thông tin vào biểu mẫu.',
    tip: 'Đọc trước các đáp án, tập trung vào thông tin cụ thể (số, địa điểm, thời gian).',
    practiceHref: '/practice-test/listening/exam',
    gradient: 'listening',
  },
  {
    key: 'sprachbausteine',
    title: 'Sprachbausteine',
    titleDe: 'Cấu trúc ngôn ngữ',
    duration: '~20 phút',
    summary: '2 phần: điền từ vào câu từ danh sách cho sẵn, chọn từ phù hợp về ngữ pháp.',
    parts:
      'Phần 1 (~10 câu): Điền từ thích hợp từ danh sách 15 từ. Phần 2 (~10 câu): Chọn 1 trong 3 đáp án để điền vào chỗ trống trong đoạn văn.',
    tip: 'Đây là phần đặc trưng của TELC (Goethe không có). Ôn kỹ giới từ, mạo từ, liên từ và Konjunktionen.',
    practiceHref: '/practice-test/reading/exam',
    gradient: 'vocab',
  },
  {
    key: 'schreiben',
    title: 'Schreiben',
    titleDe: 'Viết',
    duration: '~30 phút',
    summary:
      'Viết thư/email chính thức hoặc bán chính thức (80–100 từ) phản hồi một tình huống cho trước.',
    parts:
      '1 nhiệm vụ duy nhất: viết thư/email phản hồi bạn bè hoặc tổ chức. Cần trả lời đầy đủ các gạch đầu dòng được cho. Viết đủ 80–100 từ.',
    tip: 'Dùng mẫu: Anrede → Einleitung → Hauptteil (3 yêu cầu) → Schlussformel. Đếm từ cẩn thận.',
    practiceHref: '/practice-test/writing/exam',
    gradient: 'writing',
  },
  {
    key: 'sprechen',
    title: 'Sprechen',
    titleDe: 'Nói',
    duration: '~15–20 phút',
    summary:
      'Thi theo nhóm 3–4 người. Chia 3 Teil: tự giới thiệu (Teil 1), thảo luận và lên kế hoạch (Teil 2), đặt/trả lời yêu cầu lịch sự (Teil 3).',
    parts:
      'Teil 1: Tự giới thiệu bản thân. Teil 2: Cùng nhóm thảo luận và đi đến quyết định chung. Teil 3: Đặt câu hỏi/yêu cầu lịch sự và trả lời.',
    tip: 'Điểm Sprechen chiếm 25% tổng điểm — đừng bỏ qua. Chuẩn bị sẵn 3–4 chủ đề thảo luận B1: Umwelt, Arbeit, Familie, Freizeit.',
    practiceHref: '/practice-test/speaking/exam',
    gradient: 'speaking',
  },
];

// ─── 3. 12-week Roadmap ──────────────────────────────────────────────────────

export interface RoadmapPhase {
  weeks: string;
  title: string;
  bullets: string[];
}

export const roadmap12w: RoadmapPhase[] = [
  {
    weeks: 'Tuần 1–2',
    title: 'Ôn tập A2 — nền tảng',
    bullets: [
      'Ôn lại ngữ pháp A2: Perfekt, Präteritum, Modalverben',
      'Học 200 từ vựng A2 cơ bản qua flashcard',
      'Luyện nghe hội thoại hàng ngày A2',
      'Làm 1 đề thi thử A2 để đánh giá trình độ',
    ],
  },
  {
    weeks: 'Tuần 3–5',
    title: 'Ngữ pháp B1 quan trọng',
    bullets: [
      'Konjunktiv II: würde, könnte, sollte, müsste',
      'Relativsätze: der/die/das + Relativpronomen trong câu quan hệ',
      'Passiv: wird gemacht, wurde gemacht',
      'Infinitiv với zu: Es ist wichtig, ... zu + Infinitiv',
    ],
  },
  {
    weeks: 'Tuần 6–8',
    title: 'Từ vựng B1 theo chủ đề thi',
    bullets: [
      'Chủ đề Arbeit & Beruf: nghề nghiệp, nơi làm việc',
      'Chủ đề Gesundheit: sức khỏe, bệnh viện, thuốc',
      'Chủ đề Umwelt: môi trường, thời tiết, thiên nhiên',
      'Chủ đề Familie & Gesellschaft: gia đình, xã hội',
    ],
  },
  {
    weeks: 'Tuần 9–11',
    title: 'Luyện từng kỹ năng',
    bullets: [
      'Lesen: luyện đọc 3–4 bài/ngày, ôn cách skimming/scanning',
      'Hören: nghe 2–3 bài/ngày, tập nhận dạng từ khóa',
      'Schreiben: viết email/thư mỗi ngày, dùng mẫu chuẩn',
      'Sprechen: luyện với AI partner, ôn Redemittel',
    ],
  },
  {
    weeks: 'Tuần 12+',
    title: 'Mô phỏng thi thật',
    bullets: [
      'Làm đề thi thử đầy đủ theo thời gian thật',
      'Phân tích lỗi sai, ôn tập điểm yếu',
      'Tăng tốc độ làm bài Lesen và Hören',
      'Luyện Sprechen với các chủ đề ngẫu nhiên',
    ],
  },
];

// ─── 4. Skill Guide — Schreiben templates ────────────────────────────────────

export interface TemplateStep {
  label: string;
  example: string;
  note: string;
}

export const schreibenTemplateTelc: TemplateStep[] = [
  {
    label: 'Anrede',
    example: 'Liebe/r [Name], / Sehr geehrte/r Frau/Herr [Name],',
    note: 'Mở đầu thư — "Liebe" cho bạn bè, "Sehr geehrte" cho người lạ/tổ chức',
  },
  {
    label: 'Einleitung',
    example: 'Vielen Dank für deine/Ihre Nachricht. Ich freue mich, von dir/Ihnen zu hören.',
    note: 'Mở đề — cảm ơn hoặc nhắc đến lý do viết thư',
  },
  {
    label: 'Hauptteil',
    example:
      'Zu deiner/Ihrer Frage möchte ich sagen, dass... Außerdem... / Ich schlage vor, dass...',
    note: 'Nội dung chính — trả lời ĐỦ 3 yêu cầu được đề bài đưa ra',
  },
  {
    label: 'Schlussformel',
    example: 'Ich freue mich auf deine/Ihre Antwort. / Bis bald! / Mit freundlichen Grüßen,',
    note: 'Kết thư — câu kết và lời chào',
  },
  {
    label: 'Unterschrift',
    example: '[Tên của bạn]',
    note: 'Chữ ký — chỉ viết tên, không viết họ trong thư bạn bè',
  },
];

export const schreibenGoetheTeil1: TemplateStep[] = [
  {
    label: 'Anrede',
    example: 'Liebe/r [Name],',
    note: 'Dùng "Sehr geehrte/r" nếu là diễn đàn/tổ chức',
  },
  {
    label: 'Einleitung',
    example: 'Vielen Dank für deine Nachricht über...',
    note: 'Nhắc đến lý do viết thư',
  },
  {
    label: 'Hauptteil',
    example: '...',
    note: 'Trả lời đủ 3 yêu cầu được gạch đầu dòng trong đề bài',
  },
  {
    label: 'Schluss + Unterschrift',
    example: 'Bis bald! / Viele Grüße, [Tên]',
    note: 'Câu kết và chữ ký',
  },
];

export const schreibenGoetheTeil2: TemplateStep[] = [
  {
    label: 'Einleitung',
    example: 'Das Thema [X] ist heutzutage sehr wichtig, weil...',
    note: 'Nêu vấn đề',
  },
  {
    label: 'Pro-Argument',
    example: 'Einerseits... / Ein Vorteil ist, dass...',
    note: 'Lập luận ủng hộ',
  },
  {
    label: 'Contra-Argument',
    example: 'Andererseits... / Ein Nachteil ist, dass...',
    note: 'Lập luận phản bác',
  },
  {
    label: 'Meinung cá nhân',
    example: 'Meiner Meinung nach... / Ich bin der Ansicht, dass...',
    note: 'Nêu quan điểm cá nhân',
  },
];

export const schreibenMistakes: string[] = [
  'Không trả lời đủ các yêu cầu được gạch đầu dòng → mất điểm nặng nhất',
  'Goethe Teil 2: chỉ nêu 1 chiều (toàn pro hoặc toàn contra) thay vì cả hai',
  'Viết quá ngắn (dưới 60–70 từ) hoặc quá dài (trên 120 từ)',
  'Dùng "Hallo" thay "Liebe/r" khi viết email bán chính thức',
  'Quên Anrede, Schlussformel hoặc chữ ký',
];

// ─── 5. Skill Guide — Sprechen Redemittel & 3 Teil ───────────────────────────

export interface RedemittelGroup {
  category: string;
  phrases: string[];
}

export const sprechenRedemittel: RedemittelGroup[] = [
  {
    category: 'Đưa ra ý kiến',
    phrases: [
      'Ich denke/glaube, dass...',
      'Meiner Meinung nach...',
      'Ich bin der Meinung, dass...',
      'Ich finde, dass...',
    ],
  },
  {
    category: 'Đồng ý / không đồng ý',
    phrases: [
      'Das stimmt. / Genau.',
      'Da bin ich anderer Meinung.',
      'Das sehe ich anders, weil...',
      'Ich stimme dir zu.',
    ],
  },
  {
    category: 'Lên kế hoạch',
    phrases: [
      'Wir könnten... / Wir sollten...',
      'Ich schlage vor, dass...',
      'Was hältst du von...?',
      'Einverstanden! / Das klingt gut.',
    ],
  },
  {
    category: 'Giải thích & lý do',
    phrases: [
      '...weil / ...denn / ...deshalb',
      'Das ist wichtig, damit...',
      'Zum Beispiel...',
      'Das bedeutet, dass...',
    ],
  },
];

export const sprechenGoetheCriteria: { name: string; description: string }[] = [
  { name: 'Aufgabenbewältigung', description: 'Hoàn thành đúng và đủ yêu cầu' },
  { name: 'Kohärenz', description: 'Nói mạch lạc, có cấu trúc' },
  { name: 'Wortschatz', description: 'Từ vựng phong phú, dùng đúng' },
  { name: 'Grammatik', description: 'Cấu trúc ngữ pháp đúng' },
];

export const sprechenTelcTeile: { teil: string; tips: string[] }[] = [
  {
    teil: 'Teil 1 — Sich vorstellen',
    tips: [
      'Chuẩn bị sẵn: Tên, tuổi, quê, nghề nghiệp, sở thích, gia đình',
      'Dùng "Ich heiße...", "Ich komme aus...", "Ich arbeite als..."',
      'Thêm chi tiết thú vị: "In meiner Freizeit..." / "Am liebsten..."',
      'Tránh đọc thuộc lòng — nói tự nhiên như đang trò chuyện',
    ],
  },
  {
    teil: 'Teil 2 — Gemeinsam planen',
    tips: [
      'Đề xuất ý tưởng: "Ich schlage vor, dass wir..." / "Wir könnten..."',
      'Hỏi ý kiến nhau: "Was meinst du?" / "Bist du einverstanden?"',
      'Phản ứng với đề xuất: "Das ist eine gute Idee." / "Das finde ich nicht so gut, weil..."',
      'Đi đến kết luận chung: "Also, wir haben uns entschieden..."',
    ],
  },
  {
    teil: 'Teil 3 — Bitte oder Ausdruck',
    tips: [
      'Đặt câu lịch sự: "Könnten Sie...?" / "Würden Sie bitte...?"',
      'Giải thích lý do không thực hiện được: "Ich kann leider nicht..., weil..."',
      'Xin lỗi đúng cách: "Es tut mir sehr leid, aber..." / "Entschuldigung, ich..."',
      'Đề nghị giải pháp thay thế: "Vielleicht könnten wir stattdessen..."',
    ],
  },
];

// ─── 6. Skill Guide — Lesen Tips ─────────────────────────────────────────────

export const lesenTips: { title: string; description: string }[] = [
  {
    title: 'Đọc câu hỏi trước',
    description: 'Biết mình cần tìm gì → đọc bài có mục tiêu, tiết kiệm thời gian.',
  },
  {
    title: 'Gạch chân từ khóa',
    description: 'Tìm từ khóa trong câu hỏi và bài đọc — thường xuất hiện gần đáp án.',
  },
  {
    title: 'Chú ý từ phủ định',
    description: '"nicht", "kein", "niemand", "nie" — đảo nghĩa câu, dễ nhầm lẫn.',
  },
  {
    title: 'Loại trừ đáp án sai',
    description: 'Nếu không chắc, loại bỏ đáp án rõ ràng sai → tăng xác suất chọn đúng.',
  },
  {
    title: '"Nicht im Text" ≠ sai',
    description: 'Đối với câu "không có trong bài" — tìm chứng cứ, không suy luận.',
  },
];

// ─── 7. Skill Guide — Sprachbausteine (TELC only) ────────────────────────────

export const sprachbausteineGroups: { title: string; items: string[] }[] = [
  {
    title: 'Giới từ hay gặp',
    items: [
      'auf + Akk/Dat',
      'mit + Dat',
      'für + Akk',
      'über + Akk',
      'wegen + Gen',
      'trotz + Gen',
    ],
  },
  {
    title: 'Liên từ phổ biến',
    items: [
      'weil (vì)',
      'obwohl (mặc dù)',
      'damit (để)',
      'wenn (nếu)',
      'dass (rằng)',
      'während (trong khi)',
    ],
  },
  {
    title: 'Đại từ quan hệ',
    items: [
      'der/die/das (Nom)',
      'den/die/das (Akk)',
      'dem/der/dem (Dat)',
      'dessen/deren (Gen)',
    ],
  },
  {
    title: 'Trạng từ liên kết',
    items: [
      'deshalb (vì vậy)',
      'trotzdem (tuy nhiên)',
      'außerdem (ngoài ra)',
      'jedoch (tuy nhiên)',
      'daher (do đó)',
    ],
  },
];

// ─── 8. Grammar Table & Vocab by Topic ───────────────────────────────────────

export const grammarTable: { name: string; example: string; usage: string }[] = [
  {
    name: 'Konjunktiv II',
    example: 'Ich würde gerne nach Deutschland fahren.',
    usage: 'Ước muốn, đề nghị lịch sự',
  },
  {
    name: 'Relativsatz',
    example: 'Das Buch, das ich gelesen habe, war interessant.',
    usage: 'Câu quan hệ',
  },
  {
    name: 'Passiv Präsens',
    example: 'Das Formular wird ausgefüllt.',
    usage: 'Bị động hiện tại',
  },
  {
    name: 'Infinitiv + zu',
    example: 'Es ist wichtig, Deutsch zu lernen.',
    usage: 'Động từ nguyên thể với zu',
  },
  {
    name: 'Wechselpräpositionen',
    example: 'Ich lege das Buch auf den Tisch.',
    usage: 'Giới từ 2 cách',
  },
  {
    name: 'Zweiteilige Konjunktionen',
    example: 'Nicht nur..., sondern auch...',
    usage: 'Liên từ ghép đôi',
  },
];

export interface VocabTopic {
  title: string;
  titleDe: string;
  words: string[];
}

export const vocabByTopic: VocabTopic[] = [
  {
    title: 'Công việc & Nghề nghiệp',
    titleDe: 'Arbeit & Beruf',
    words: ['der Arbeitgeber', 'die Bewerbung', 'das Gehalt', 'die Ausbildung', 'kündigen'],
  },
  {
    title: 'Sức khỏe',
    titleDe: 'Gesundheit',
    words: ['die Erkältung', 'das Rezept', 'der Termin', 'untersuchen', 'sich erholen'],
  },
  {
    title: 'Nhà ở',
    titleDe: 'Wohnen',
    words: ['die Miete', 'der Vermieter', 'umziehen', 'die Kaution', 'renovieren'],
  },
  {
    title: 'Du lịch & Giao thông',
    titleDe: 'Reise & Verkehr',
    words: ['der Flug', 'buchen', 'die Unterkunft', 'verpassen', 'der Fahrplan'],
  },
  {
    title: 'Môi trường',
    titleDe: 'Umwelt & Natur',
    words: ['die Umwelt', 'der Klimawandel', 'recyceln', 'die Verschmutzung', 'schützen'],
  },
  {
    title: 'Truyền thông',
    titleDe: 'Medien & Kommunikation',
    words: ['das Internet', 'das soziale Netzwerk', 'die Nachricht', 'posten', 'kommentieren'],
  },
];

// ─── 9. FAQ ──────────────────────────────────────────────────────────────────

export interface FaqItem {
  q: string;
  a: string;
}

export const faqList: FaqItem[] = [
  {
    q: 'Tôi nên thi Goethe hay TELC B1?',
    a: 'Cả hai đều được công nhận quốc tế và dùng được cho visa định cư, nhập tịch tại Đức. Goethe nổi tiếng hơn về thương hiệu và phổ biến trong giới học thuật. TELC có lệ phí thấp hơn một chút, có phần Sprachbausteine kiểm tra ngữ pháp riêng và Sprechen thi theo nhóm 3–4 người (Goethe thi theo cặp). Nếu mạnh ngữ pháp, chọn TELC; nếu mạnh đọc/viết tự do, chọn Goethe.',
  },
  {
    q: 'Mất bao lâu để học từ A2 lên B1?',
    a: 'Khoảng 12 tuần (3 tháng) nếu học đều đặn 1–2 tiếng/ngày — theo lộ trình ở phần "Lộ trình 12 tuần" bên trên. Người đi làm có thể cần 4–5 tháng nếu học cuối tuần. Yếu tố quan trọng nhất là ôn từ vựng đều và luyện đề thường xuyên trong 3 tuần cuối.',
  },
  {
    q: 'Lệ phí thi B1 tại Việt Nam khoảng bao nhiêu?',
    a: 'Goethe-Zertifikat B1 dao động ~2.0–2.5 triệu VND tại Hà Nội/TP.HCM. TELC Deutsch B1 thấp hơn một chút, ~1.8–2.2 triệu. Lệ phí thường tăng 5–10% mỗi năm, kiểm tra trực tiếp với Goethe-Institut Hà Nội/HCMC hoặc trung tâm TELC ủy quyền tại Việt Nam.',
  },
  {
    q: 'Phần nào hay mất điểm nhất trong đề B1?',
    a: 'Schreiben là phần hay mất điểm nhất với người tự học vì 3 lỗi: (1) không trả lời đủ các gạch đầu dòng được yêu cầu, (2) viết quá ngắn dưới 60 từ, (3) Goethe Teil 2 chỉ nêu 1 chiều pro hoặc contra. Sprechen mất điểm khi im lặng quá 5 giây, không đặt câu hỏi cho đối tác, hoặc thiếu liên từ phức tạp như weil/obwohl/damit.',
  },
  {
    q: 'AI chấm Schreiben/Sprechen có chính xác như giám khảo thật không?',
    a: 'AI dùng cùng tiêu chí chính thức của Goethe/TELC: Aufgabenbewältigung, Kohärenz, Wortschatz, Grammatik. Độ chính xác ~85–90% so với giám khảo thật cho điểm tổng, và rất chính xác trong việc phát hiện lỗi ngữ pháp/từ vựng cụ thể. Dùng AI để luyện đều đặn, sau đó nhờ giáo viên thật review 1–2 bài cuối trước khi đi thi.',
  },
  {
    q: 'Có cần học giáo trình riêng không khi đã dùng app?',
    a: 'App đủ để luyện đề và ôn ngữ pháp/từ vựng B1. Nếu mới từ A2 lên, nên kết hợp 1 giáo trình (Aspekte neu B1+, Sicher! B1+, hoặc Menschen B1) để học cấu trúc bài bản trong 4–6 tuần đầu. Sau đó chuyển sang luyện đề + AI là đủ.',
  },
  {
    q: 'Sprachbausteine có khó không và ôn ở đâu?',
    a: 'Sprachbausteine (chỉ có ở TELC) tập trung vào giới từ, liên từ, đại từ quan hệ và trạng từ liên kết. Khó với người mới quen Goethe nhưng dễ ăn điểm nếu luyện đúng — xem mục "Sprachbausteine" trong phần Cẩm nang luyện kỹ năng bên trên. Mỗi ngày luyện 10–15 câu là đủ.',
  },
];

// ─── 10. Why DeutschMeister benefits (intro to choose-exam section) ─────────

export const whyBenefits: { title: string; description: string }[] = [
  { title: 'Đề thi thử đầy đủ', description: 'Goethe & TELC B1 với đáp án chi tiết, phân tích lỗi' },
  { title: 'AI chấm điểm', description: 'Chấm Schreiben và Sprechen bằng AI theo tiêu chí thi thật' },
  { title: 'Flashcard thông minh', description: 'Từ vựng B1 theo chủ đề, phát âm chuẩn người bản ngữ' },
  { title: 'Game học vui', description: 'Der/die/das, ghép từ, nghe chép, điền từ — học mà chơi' },
  { title: 'Theo dõi tiến độ', description: 'Thống kê chi tiết từng kỹ năng, biết đang yếu ở đâu' },
  { title: 'Hoàn toàn miễn phí', description: 'Không cần thẻ tín dụng, không giới hạn số lượt luyện thi' },
];
