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
      teile: 3, questions: 15, timeMin: 45, totalPoints: 15,
      structure: ['Email → Richtig/Falsch (5 câu)', '5 yêu cầu → chọn Website A/B', '5 biển hiệu → Richtig/Falsch'],
    },
    A2: {
      teile: 4, questions: 20, timeMin: 30, totalPoints: 20,
      structure: ['Bài văn → Multiple Choice a/b/c', 'Bảng thông tin → MCQ', 'Email → MCQ', '5 người → 6 website (Zuordnung)'],
    },
    B1: {
      teile: 5, questions: 30, timeMin: 65, totalPoints: 30,
      structure: ['Email → Richtig/Falsch (6 câu)', '2 bài → MCQ a/b/c', '7 người → 10 Anzeigen (Zuordnung)', '7 ý kiến → Ja/Nein', '1 bài → MCQ a/b/c'],
    },
  },
  TELC: {
    A2: {
      teile: 5, questions: 30, timeMin: 45, totalPoints: 40,
      structure: ['Bài → Richtig/Falsch', 'Zuordnung', 'MCQ a/b/c', 'Richtig/Falsch', 'Sprachbausteine (10 gaps MCQ)'],
    },
    B1: {
      teile: 6, questions: 45, timeMin: 60, totalPoints: 60,
      structure: ['Bài dài → 10 Richtig/Falsch', 'Zuordnung', '5→8 Anzeigen (Zuordnung)', 'MCQ a/b/c', 'Richtig/Falsch', 'Sprachbausteine (20 gaps)'],
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
