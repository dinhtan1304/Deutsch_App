// Display info for exam setup pages
export const EXAM_READING_DISPLAY: Record<string, Record<string, {
  teile: number;
  questions: number;
  timeMin: number;
  totalPoints: number;
  structure: string[];
}>> = {
  GOETHE: {
    A1: {
      teile: 3, questions: 15, timeMin: 25, totalPoints: 15,
      structure: ['Email → Richtig/Falsch (5 câu)', '5 yêu cầu → chọn Anzeige A/B', '5 biển hiệu → Richtig/Falsch'],
    },
    A2: {
      teile: 4, questions: 20, timeMin: 30, totalPoints: 20,
      structure: ['Bài báo → Multiple Choice a/b/c (5)', 'Bảng thông tin / chương trình sự kiện → MCQ (5)', 'Email → MCQ (5)', '5 người → 6 Anzeigen (Zuordnung, có thể chọn X)'],
    },
    B1: {
      teile: 5, questions: 30, timeMin: 65, totalPoints: 30,
      structure: ['Blog → Richtig/Falsch (6 câu)', '2 bài báo → MCQ a/b/c (6)', '7 người → 10 Anzeigen (Zuordnung, có thể chọn X)', '7 ý kiến → Ja/Nein', 'Nội quy/Hướng dẫn → MCQ a/b/c (4)'],
    },
  },
  TELC: {
    A2: {
      teile: 5, questions: 35, timeMin: 50, totalPoints: 35,
      structure: ['5 đoạn → tiêu đề (Zuordnung Überschriften)', 'Bài → Richtig/Falsch (5)', '5 người → 7 Anzeigen (Zuordnung, có thể chọn X)', 'Sprachbausteine MCQ (10 chỗ)', 'Sprachbausteine Wortliste (10 chỗ)'],
    },
    B1: {
      teile: 5, questions: 40, timeMin: 90, totalPoints: 40,
      structure: ['5 đoạn → 10 tiêu đề (Zuordnung Überschriften)', 'Bài → MCQ a/b/c (5)', '10 tình huống → 12 Anzeigen (Zuordnung)', 'Sprachbausteine MCQ a/b/c (10 chỗ)', 'Sprachbausteine Wortliste 15 từ (10 chỗ)'],
    },
  },
};

export const EXAM_LISTENING_DISPLAY: Record<string, Record<string, {
  teile: number;
  questions: number;
  timeMin: number;
  totalPoints: number;
  structure: string[];
}>> = {
  GOETHE: {
    A1: {
      teile: 3, questions: 15, timeMin: 20, totalPoints: 15,
      structure: ['5 thông báo → Richtig/Falsch', '5 hội thoại ngắn → Multiple Choice', 'Tin nhắn thoại → Richtig/Falsch (nghe 2×)'],
    },
    A2: {
      teile: 4, questions: 19, timeMin: 25, totalPoints: 20,
      structure: ['Tin tức radio → Richtig/Falsch', '4 đoạn hội thoại → MCQ', '5 người → 7 thông báo (Zuordnung)', 'Phỏng vấn → Richtig/Falsch (nghe 2×)'],
    },
    B1: {
      teile: 4, questions: 27, timeMin: 40, totalPoints: 30,
      structure: ['Báo cáo radio → 10 Richtig/Falsch', '5 tình huống → MCQ', '5 người → 6 đoạn (Zuordnung)', 'Phỏng vấn → MCQ a/b/c (7 câu, nghe 2×)'],
    },
  },
  TELC: {
    A2: {
      teile: 3, questions: 30, timeMin: 20, totalPoints: 30,
      structure: ['10 thông báo ngắn → MCQ', '5 hội thoại → MCQ (2 câu/bài)', 'Độc thoại → 10 Richtig/Falsch'],
    },
    B1: {
      teile: 3, questions: 27, timeMin: 30, totalPoints: 30,
      structure: ['10 thông báo ngắn → MCQ', '5 báo cáo radio → MCQ (2 câu/bài)', 'Độc thoại → 7 Richtig/Falsch (nghe 2×)'],
    },
  },
};

export const EXAM_SPEAKING_DISPLAY: Record<string, Record<string, {
  teile: number;
  timeMin: number;
  totalPoints: number;
  structure: string[];
}>> = {
  GOETHE: {
    A1: {
      teile: 3, timeMin: 8, totalPoints: 15,
      structure: ['Sich vorstellen (60 giây)', 'Um etwas bitten — word cards (60 giây)', 'Auf Bitten reagieren (60 giây)'],
    },
    A2: {
      teile: 3, timeMin: 10, totalPoints: 15,
      structure: ['Über sich sprechen — picture card (90 giây)', 'Gemeinsam planen (90 giây)', 'Bitten & reagieren (60 giây)'],
    },
    B1: {
      teile: 3, timeMin: 15, totalPoints: 15,
      structure: ['Gemeinsam planen (120 giây)', 'Präsentation halten (30 giây chuẩn bị + 120 giây)', 'Auf Präsentation reagieren (90 giây)'],
    },
  },
  TELC: {
    A2: {
      teile: 3, timeMin: 10, totalPoints: 15,
      structure: ['Sich vorstellen (60 giây)', 'Informationen erfragen und geben (90 giây)', 'Bitten reagieren (60 giây)'],
    },
    B1: {
      teile: 3, timeMin: 12, totalPoints: 15,
      structure: ['Gespräch führen (120 giây)', 'Monolog halten (90 giây)', 'Gemeinsam Aufgabe lösen (90 giây)'],
    },
  },
};

export const EXAM_WRITING_DISPLAY: Record<string, Record<string, {
  teile: number;
  timeMin: number;
  totalPoints: number;
  structure: string[];
}>> = {
  GOETHE: {
    A1: {
      teile: 2, timeMin: 20, totalPoints: 15,
      structure: ['Điền form thông tin cá nhân', 'Viết email ~30 từ (3 điểm cho sẵn)'],
    },
    A2: {
      teile: 2, timeMin: 30, totalPoints: 20,
      structure: ['Viết SMS/tin nhắn ngắn', 'Viết email ~40 từ'],
    },
    B1: {
      teile: 3, timeMin: 60, totalPoints: 100,
      structure: ['Email không chính thức ~80 từ', 'Bình luận forum ~80 từ', 'Email chính thức ~40 từ'],
    },
  },
  TELC: {
    A2: {
      teile: 1, timeMin: 30, totalPoints: 60,
      structure: ['Viết email/tin nhắn ~50 từ (trả lời 3 điểm cho sẵn)'],
    },
    B1: {
      teile: 1, timeMin: 30, totalPoints: 45,
      structure: ['Viết email bán chính thức ~80-100 từ (trả lời các điểm cho sẵn)'],
    },
  },
};

// ─── ÖSD (Österreichisches Sprachdiplom) ─────────────────────────────────────
// ÖSD A1–B1 use the same format as Goethe (co-developed standard), so they reuse
// the Goethe display configs. B2 has its own structure and is added in stage 2.
EXAM_READING_DISPLAY.OESD = { ...EXAM_READING_DISPLAY.GOETHE! };
EXAM_LISTENING_DISPLAY.OESD = { ...EXAM_LISTENING_DISPLAY.GOETHE! };
EXAM_SPEAKING_DISPLAY.OESD = { ...EXAM_SPEAKING_DISPLAY.GOETHE! };
EXAM_WRITING_DISPLAY.OESD = { ...EXAM_WRITING_DISPLAY.GOETHE! };

// ─── ÖSD B2 + TestDaF (B2–C1) ────────────────────────────────────────────────
// ÖSD B2 mirrors Goethe B2; TestDaF is one B2–C1 exam shown as two difficulty
// tiers (results map to a TDN band — see lib/tdn.ts).
EXAM_LISTENING_DISPLAY.OESD!.B2 = {
  teile: 3, questions: 25, timeMin: 40, totalPoints: 100,
  structure: ['Phỏng vấn → MCQ (8 câu)', 'Bản tin radio → Richtig/Falsch (10 câu)', 'Thảo luận → MCQ (7 câu, nghe 2×)'],
};
EXAM_SPEAKING_DISPLAY.OESD!.B2 = {
  teile: 2, timeMin: 15, totalPoints: 100,
  structure: ['Präsentation halten (60s chuẩn bị + 180s)', 'Diskussion / Dialog (120s)'],
};
EXAM_WRITING_DISPLAY.OESD!.B2 = {
  teile: 2, timeMin: 90, totalPoints: 100,
  structure: ['Formeller Brief ~100–150 từ', 'Stellungnahme / Erörterung ~100–150 từ'],
};

const TESTDAF_READING_STRUCTURE = ['8 đề mục → 10 đoạn (Zuordnung)', 'Văn bản chi tiết → MCQ a/b/c (10 câu)', 'Văn bản khoa học → Ja/Nein/Text dazu nichts (10 câu)'];
const TESTDAF_LISTENING_STRUCTURE = ['Hội thoại → ghi chú / Richtig-Falsch (8 câu)', 'Phỏng vấn → Richtig/Falsch (10 câu)', 'Bài giảng chuyên gia → MCQ (7 câu)'];
const TESTDAF_SPEAKING_STRUCTURE = ['Thông tin: hỏi/nhờ (30s)', 'Nói về bản thân (60s)', 'Mô tả Grafik (90s)', 'Stellung nehmen (120s)', 'Đưa giả thuyết (90s)', 'Cho lời khuyên (60s)', 'Cân nhắc & quyết định (120s)'];

EXAM_READING_DISPLAY.TESTDAF = {
  B2: { teile: 3, questions: 28, timeMin: 60, totalPoints: 100, structure: TESTDAF_READING_STRUCTURE },
  C1: { teile: 3, questions: 28, timeMin: 60, totalPoints: 100, structure: TESTDAF_READING_STRUCTURE },
};
EXAM_LISTENING_DISPLAY.TESTDAF = {
  B2: { teile: 3, questions: 25, timeMin: 40, totalPoints: 100, structure: TESTDAF_LISTENING_STRUCTURE },
  C1: { teile: 3, questions: 25, timeMin: 40, totalPoints: 100, structure: TESTDAF_LISTENING_STRUCTURE },
};
EXAM_SPEAKING_DISPLAY.TESTDAF = {
  B2: { teile: 7, timeMin: 35, totalPoints: 100, structure: TESTDAF_SPEAKING_STRUCTURE },
  C1: { teile: 7, timeMin: 35, totalPoints: 100, structure: TESTDAF_SPEAKING_STRUCTURE },
};
EXAM_WRITING_DISPLAY.TESTDAF = {
  B2: { teile: 1, timeMin: 60, totalPoints: 100, structure: ['Schriftlicher Ausdruck: mô tả Grafik/số liệu + lập luận (~250–350 từ)'] },
  C1: { teile: 1, timeMin: 60, totalPoints: 100, structure: ['Schriftlicher Ausdruck: mô tả Grafik/số liệu + lập luận (~300–400 từ)'] },
};

// ─── Reading B2 / C1 display — provider-specific (Goethe/ÖSD vs telc differ) ──
// Goethe/ÖSD B2 Lesen (5 Teile, 65′) and C1 (4 Teile, 65′).
const GOETHE_B2_READING_DISP = { teile: 5, questions: 30, timeMin: 65, totalPoints: 30, structure: ['4 bài → 9 phát biểu (Zuordnung, có thể chọn X)', 'Lückentext: chọn từ/cụm (6 chỗ)', 'Bài báo → MCQ a/b/c (6)', '8 bình luận → 6 phát biểu (Zuordnung)', 'Zuordnung ngắn (3)'] };
const GOETHE_C1_READING_DISP = { teile: 4, questions: 30, timeMin: 65, totalPoints: 30, structure: ['Lückentext MC 4 lựa chọn (8 chỗ)', 'Bài báo → MCQ (7)', 'Textrekonstruktion: điền câu (8 chỗ)', '7 phát biểu → 3 tác giả (Zuordnung, có thể chọn X)'] };
// telc B2 / C1 Lesen — Leseverstehen 3 Teile + Sprachbausteine.
const TELC_B2_READING_DISP = { teile: 4, questions: 42, timeMin: 90, totalPoints: 42, structure: ['5 đoạn → 10 tiêu đề (Zuordnung)', 'Bài → MCQ a/b/c (5)', '10 tình huống → 12 Anzeigen (Zuordnung)', 'Sprachbausteine 22 câu (MCQ + Wortliste)'] };
const TELC_C1_READING_DISP = { teile: 4, questions: 45, timeMin: 90, totalPoints: 45, structure: ['Textrekonstruktion: điền câu (6 chỗ)', '6 selektiv (Zuordnung, có thể chọn X)', 'Ja / Nein / Steht nicht im Text (11 câu)', 'Sprachbausteine 22 câu (MCQ 4 lựa chọn)'] };
EXAM_READING_DISPLAY.GOETHE!.B2 = GOETHE_B2_READING_DISP;
EXAM_READING_DISPLAY.GOETHE!.C1 = GOETHE_C1_READING_DISP;
EXAM_READING_DISPLAY.OESD!.B2 = GOETHE_B2_READING_DISP;
EXAM_READING_DISPLAY.OESD!.C1 = GOETHE_C1_READING_DISP;
EXAM_READING_DISPLAY.TELC!.B2 = TELC_B2_READING_DISP;
EXAM_READING_DISPLAY.TELC!.C1 = TELC_C1_READING_DISP;

const B2_LISTENING_DISP = { teile: 3, questions: 25, timeMin: 40, totalPoints: 100, structure: ['Phỏng vấn → MCQ (8 câu)', 'Bản tin radio → Richtig/Falsch (10 câu)', 'Thảo luận → MCQ (7 câu, nghe 2×)'] };
const C1_LISTENING_DISP = { teile: 3, questions: 30, timeMin: 40, totalPoints: 100, structure: ['Phỏng vấn học thuật → MCQ (10 câu)', 'Phóng sự → Richtig/Falsch (12 câu)', 'Thảo luận chuyên môn → MCQ (8 câu)'] };
EXAM_LISTENING_DISPLAY.GOETHE!.B2 = B2_LISTENING_DISP;
EXAM_LISTENING_DISPLAY.GOETHE!.C1 = C1_LISTENING_DISP;
EXAM_LISTENING_DISPLAY.TELC!.B2 = B2_LISTENING_DISP;
EXAM_LISTENING_DISPLAY.TELC!.C1 = C1_LISTENING_DISP;
EXAM_LISTENING_DISPLAY.OESD!.C1 = C1_LISTENING_DISP;

const B2_SPEAKING_DISP = { teile: 2, timeMin: 15, totalPoints: 100, structure: ['Präsentation halten (60s chuẩn bị + 180s)', 'Diskussion / Dialog (120s)'] };
const C1_SPEAKING_DISP = { teile: 3, timeMin: 20, totalPoints: 100, structure: ['Präsentation (60s + 240s)', 'Stellung nehmen (60s + 180s)', 'Diskussion / Dialog (120s)'] };
EXAM_SPEAKING_DISPLAY.GOETHE!.B2 = B2_SPEAKING_DISP;
EXAM_SPEAKING_DISPLAY.GOETHE!.C1 = C1_SPEAKING_DISP;
EXAM_SPEAKING_DISPLAY.TELC!.B2 = B2_SPEAKING_DISP;
EXAM_SPEAKING_DISPLAY.TELC!.C1 = C1_SPEAKING_DISP;
EXAM_SPEAKING_DISPLAY.OESD!.C1 = C1_SPEAKING_DISP;

const B2_WRITING_DISP = { teile: 2, timeMin: 90, totalPoints: 100, structure: ['Formeller Brief ~100–150 từ', 'Stellungnahme / Erörterung ~100–150 từ'] };
const C1_WRITING_DISP = { teile: 2, timeMin: 100, totalPoints: 100, structure: ['Formeller Brief / Beschwerde ~150–220 từ', 'Erörterung ~200–280 từ'] };
EXAM_WRITING_DISPLAY.GOETHE!.B2 = B2_WRITING_DISP;
EXAM_WRITING_DISPLAY.GOETHE!.C1 = C1_WRITING_DISP;
EXAM_WRITING_DISPLAY.TELC!.B2 = B2_WRITING_DISP;
EXAM_WRITING_DISPLAY.TELC!.C1 = C1_WRITING_DISP;
EXAM_WRITING_DISPLAY.OESD!.C1 = C1_WRITING_DISP;
