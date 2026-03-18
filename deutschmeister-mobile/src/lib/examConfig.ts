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
      structure: ['Email \u2192 Richtig/Falsch (5 c\u00E2u)', '5 y\u00EAu c\u1EA7u \u2192 ch\u1ECDn Website A/B', '5 bi\u1EC3n hi\u1EC7u \u2192 Richtig/Falsch'],
    },
    A2: {
      teile: 4, questions: 20, timeMin: 30, totalPoints: 20,
      structure: ['B\u00E0i v\u0103n \u2192 Multiple Choice a/b/c', 'B\u1EA3ng th\u00F4ng tin \u2192 MCQ', 'Email \u2192 MCQ', '5 ng\u01B0\u1EDDi \u2192 6 website (Zuordnung)'],
    },
    B1: {
      teile: 5, questions: 30, timeMin: 65, totalPoints: 30,
      structure: ['Email \u2192 Richtig/Falsch (6 c\u00E2u)', '2 b\u00E0i \u2192 MCQ a/b/c', '7 ng\u01B0\u1EDDi \u2192 10 Anzeigen (Zuordnung)', '7 \u00FD ki\u1EBFn \u2192 Ja/Nein', '1 b\u00E0i \u2192 MCQ a/b/c'],
    },
  },
  TELC: {
    A2: {
      teile: 5, questions: 30, timeMin: 45, totalPoints: 40,
      structure: ['B\u00E0i \u2192 Richtig/Falsch', 'Zuordnung', 'MCQ a/b/c', 'Richtig/Falsch', 'Sprachbausteine (10 gaps MCQ)'],
    },
    B1: {
      teile: 6, questions: 45, timeMin: 60, totalPoints: 60,
      structure: ['B\u00E0i d\u00E0i \u2192 10 Richtig/Falsch', 'Zuordnung', '5\u21928 Anzeigen (Zuordnung)', 'MCQ a/b/c', 'Richtig/Falsch', 'Sprachbausteine (20 gaps)'],
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
      structure: ['5 th\u00F4ng b\u00E1o \u2192 Richtig/Falsch', '5 h\u1ED9i tho\u1EA1i ng\u1EAFn \u2192 Multiple Choice', 'Tin nh\u1EAFn tho\u1EA1i \u2192 Richtig/Falsch (nghe 2\u00D7)'],
    },
    A2: {
      teile: 4, questions: 19, timeMin: 25, totalPoints: 20,
      structure: ['Tin t\u1EE9c radio \u2192 Richtig/Falsch', '4 \u0111o\u1EA1n h\u1ED9i tho\u1EA1i \u2192 MCQ', '5 ng\u01B0\u1EDDi \u2192 7 th\u00F4ng b\u00E1o (Zuordnung)', 'Ph\u1ECFng v\u1EA5n \u2192 Richtig/Falsch (nghe 2\u00D7)'],
    },
    B1: {
      teile: 4, questions: 27, timeMin: 40, totalPoints: 30,
      structure: ['B\u00E1o c\u00E1o radio \u2192 10 Richtig/Falsch', '5 t\u00ECnh hu\u1ED1ng \u2192 MCQ', '5 ng\u01B0\u1EDDi \u2192 6 \u0111o\u1EA1n (Zuordnung)', 'Ph\u1ECFng v\u1EA5n \u2192 MCQ a/b/c (7 c\u00E2u, nghe 2\u00D7)'],
    },
  },
  TELC: {
    A2: {
      teile: 3, questions: 30, timeMin: 20, totalPoints: 30,
      structure: ['10 th\u00F4ng b\u00E1o ng\u1EAFn \u2192 MCQ', '5 h\u1ED9i tho\u1EA1i \u2192 MCQ (2 c\u00E2u/b\u00E0i)', '\u0110\u1ED9c tho\u1EA1i \u2192 10 Richtig/Falsch'],
    },
    B1: {
      teile: 3, questions: 27, timeMin: 30, totalPoints: 30,
      structure: ['10 th\u00F4ng b\u00E1o ng\u1EAFn \u2192 MCQ', '5 b\u00E1o c\u00E1o radio \u2192 MCQ (2 c\u00E2u/b\u00E0i)', '\u0110\u1ED9c tho\u1EA1i \u2192 7 Richtig/Falsch (nghe 2\u00D7)'],
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
      structure: ['Sich vorstellen (60 gi\u00E2y)', 'Um etwas bitten \u2014 word cards (60 gi\u00E2y)', 'Auf Bitten reagieren (60 gi\u00E2y)'],
    },
    A2: {
      teile: 3, timeMin: 10, totalPoints: 15,
      structure: ['\u00DCber sich sprechen \u2014 picture card (90 gi\u00E2y)', 'Gemeinsam planen (90 gi\u00E2y)', 'Bitten & reagieren (60 gi\u00E2y)'],
    },
    B1: {
      teile: 3, timeMin: 15, totalPoints: 15,
      structure: ['Gemeinsam planen (120 gi\u00E2y)', 'Pr\u00E4sentation halten (30 gi\u00E2y chu\u1EA9n b\u1ECB + 120 gi\u00E2y)', 'Auf Pr\u00E4sentation reagieren (90 gi\u00E2y)'],
    },
  },
  TELC: {
    A2: {
      teile: 3, timeMin: 10, totalPoints: 15,
      structure: ['Sich vorstellen (60 gi\u00E2y)', 'Informationen erfragen und geben (90 gi\u00E2y)', 'Bitten reagieren (60 gi\u00E2y)'],
    },
    B1: {
      teile: 3, timeMin: 12, totalPoints: 15,
      structure: ['Gespr\u00E4ch f\u00FChren (120 gi\u00E2y)', 'Monolog halten (90 gi\u00E2y)', 'Gemeinsam Aufgabe l\u00F6sen (90 gi\u00E2y)'],
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
      structure: ['\u0110i\u1EC1n form th\u00F4ng tin c\u00E1 nh\u00E2n', 'Vi\u1EBFt email ~30 t\u1EEB (3 \u0111i\u1EC3m cho s\u1EB5n)'],
    },
    A2: {
      teile: 2, timeMin: 30, totalPoints: 20,
      structure: ['Vi\u1EBFt SMS/tin nh\u1EAFn ng\u1EAFn', 'Vi\u1EBFt email ~40 t\u1EEB'],
    },
    B1: {
      teile: 3, timeMin: 60, totalPoints: 100,
      structure: ['Email kh\u00F4ng ch\u00EDnh th\u1EE9c ~80 t\u1EEB', 'B\u00ECnh lu\u1EADn forum ~80 t\u1EEB', 'Email ch\u00EDnh th\u1EE9c ~40 t\u1EEB'],
    },
  },
  TELC: {
    A2: {
      teile: 1, timeMin: 30, totalPoints: 60,
      structure: ['Vi\u1EBFt email/tin nh\u1EAFn ~50 t\u1EEB (tr\u1EA3 l\u1EDDi 3 \u0111i\u1EC3m cho s\u1EB5n)'],
    },
    B1: {
      teile: 1, timeMin: 30, totalPoints: 45,
      structure: ['Vi\u1EBFt email b\u00E1n ch\u00EDnh th\u1EE9c ~80-100 t\u1EEB (tr\u1EA3 l\u1EDDi c\u00E1c \u0111i\u1EC3m cho s\u1EB5n)'],
    },
  },
};
