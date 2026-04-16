/**
 * Static mapping from writing error types to contextual mini-lessons.
 *
 * Used by the writing result page to show a "why" tip + grammar lesson link
 * at the moment the learner sees an error. Frontend-only because this content
 * rarely changes and a DB round-trip would add latency for no benefit.
 */

export interface ErrorTip {
  /** Short rule the learner should remember (2-3 sentences max). */
  tipVi: string;
  /** One concrete example the learner can anchor to. */
  example: string;
  /** Grammar lesson slug to link to — matches `/grammar/[slug]`. Null if no dedicated lesson. */
  lessonSlug: string | null;
  /** Display title for the lesson CTA button. */
  lessonTitleVi: string | null;
}

export const ERROR_TIPS: Record<string, ErrorTip> = {
  article: {
    tipVi:
      'Mỗi danh từ tiếng Đức có giống cố định (der/die/das) và bạn phải học cùng từ vựng. Một số đuôi có quy luật: -e thường feminine, -chen/-lein luôn neuter, -er chỉ người thường masculine.',
    example: 'der Tisch (m) · die Lampe (f) · das Buch (n) · das Mädchen (n, không phải die)',
    lessonSlug: 'a1-l07-definite-articles',
    lessonTitleVi: 'Mạo từ xác định der/die/das',
  },
  case: {
    tipVi:
      'Cách (Kasus) phụ thuộc vai trò của danh từ trong câu: Nominativ cho chủ ngữ, Akkusativ cho tân ngữ trực tiếp, Dativ cho tân ngữ gián tiếp. Nhiều giới từ cũng cố định đi với 1 cách.',
    example: 'Ich (Nom) sehe den Hund (Akk). · Ich helfe dem Kind (Dat). · für + Akk, mit + Dat.',
    lessonSlug: 'a1-l13-accusative',
    lessonTitleVi: 'Kasus — Akkusativ',
  },
  word_order: {
    tipVi:
      'Câu chính tiếng Đức tuân thủ quy tắc V2: động từ chia luôn đứng ở vị trí 2, bất kể cái gì đứng đầu. Trong câu phụ (weil, dass, wenn...) động từ chia đứng cuối.',
    example: 'Heute gehe ich ins Kino. (không phải "Heute ich gehe...") · ..., weil ich müde bin.',
    lessonSlug: 'a1-l17-sentence-structure',
    lessonTitleVi: 'Cấu trúc câu V2',
  },
  conjugation: {
    tipVi:
      'Động từ phải chia theo ngôi (ich/du/er...) và thì. Các động từ bất quy tắc đổi gốc ở du/er/sie/es ở thì hiện tại (fahren → du fährst).',
    example: 'ich gehe · du gehst · er geht · wir gehen · ihr geht · sie gehen',
    lessonSlug: 'a1-l05-regular-verbs',
    lessonTitleVi: 'Chia động từ — Präsens',
  },
  grammar: {
    tipVi:
      'Lỗi ngữ pháp chung — kiểm tra lại thì, chia động từ, giống danh từ và trật tự từ trong câu.',
    example: '',
    lessonSlug: null,
    lessonTitleVi: null,
  },
  spelling: {
    tipVi:
      'Danh từ tiếng Đức luôn viết hoa, kể cả ở giữa câu. Phân biệt ß (sau nguyên âm dài: Straße) và ss (sau nguyên âm ngắn: Fluss). Chú ý umlaut ä/ö/ü — không thể thay bằng ae/oe/ue trong bài thi.',
    example: 'der Tisch (không phải "der tisch") · die Straße · ich heiße',
    lessonSlug: null,
    lessonTitleVi: null,
  },
  vocabulary: {
    tipVi:
      'Chọn từ đúng ngữ cảnh và dùng collocation quen thuộc thay vì dịch từng từ từ tiếng Việt. Ghi từ mới kèm ví dụ câu thay vì chỉ học nghĩa đơn lẻ.',
    example: 'eine Entscheidung treffen (đưa ra quyết định) — không phải "machen"',
    lessonSlug: null,
    lessonTitleVi: null,
  },
};

export function getErrorTip(errorType: string): ErrorTip | null {
  return ERROR_TIPS[errorType] ?? null;
}
