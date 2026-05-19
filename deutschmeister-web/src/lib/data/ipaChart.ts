/**
 * German IPA chart — static reference data for /learn/ipa.
 *
 * Coverage: standard German (Hochdeutsch) phonemic inventory.
 * - 8 short vowels + 7 long vowels + schwa + vocalic-r = 17 vowels
 * - 3 diphthongs (aɪ, aʊ, ɔʏ)
 * - 22 consonants
 * - 2 affricates (pf, ts)
 *
 * `drillPhonemeKey` maps to existing slugs in
 * deutschmeister-api/src/modules/pronunciation/data/phoneme-drills.ts so the
 * detail panel can deep-link into the matching drill at
 * /practice-test/pronunciation/drills/[phoneme].
 */

export type IpaCategory = 'vowel-short' | 'vowel-long' | 'diphthong' | 'consonant' | 'affricate';

export interface IpaExample {
  word: string;
  translationVi: string;
}

export interface IpaSymbol {
  ipa: string;
  nameVi: string;
  nameDe: string;
  category: IpaCategory;
  spellings: string[];
  tipVi: string;
  examples: IpaExample[];
  drillPhonemeKey?: string;
  difficultyForVi?: 'low' | 'medium' | 'high';
}

export const IPA_CATEGORY_LABELS: Record<IpaCategory, string> = {
  'vowel-short': 'Nguyên âm ngắn',
  'vowel-long': 'Nguyên âm dài',
  'diphthong': 'Nguyên âm đôi',
  'consonant': 'Phụ âm',
  'affricate': 'Phụ âm kép',
};

export const IPA_CHART: IpaSymbol[] = [
  // ── Short vowels ───────────────────────────────────────────────
  {
    ipa: 'a',
    nameVi: 'a ngắn',
    nameDe: 'kurzes a',
    category: 'vowel-short',
    spellings: ['a'],
    tipVi: 'Gần giống "a" tiếng Việt nhưng ngắn và gọn hơn.',
    examples: [
      { word: 'Mann', translationVi: 'người đàn ông' },
      { word: 'Stadt', translationVi: 'thành phố' },
      { word: 'kalt', translationVi: 'lạnh' },
    ],
    difficultyForVi: 'low',
  },
  {
    ipa: 'ɛ',
    nameVi: 'e ngắn (mở)',
    nameDe: 'kurzes e',
    category: 'vowel-short',
    spellings: ['e', 'ä'],
    tipVi: 'Mở miệng rộng hơn "e" tiếng Việt, gần với "e" trong "em".',
    examples: [
      { word: 'Bett', translationVi: 'cái giường' },
      { word: 'Mensch', translationVi: 'con người' },
      { word: 'Hände', translationVi: 'các bàn tay' },
    ],
    difficultyForVi: 'low',
  },
  {
    ipa: 'ɪ',
    nameVi: 'i ngắn',
    nameDe: 'kurzes i',
    category: 'vowel-short',
    spellings: ['i'],
    tipVi: 'Ngắn và hơi mở hơn so với "i" dài. Gần như "i" trong "kim".',
    examples: [
      { word: 'Kind', translationVi: 'đứa trẻ' },
      { word: 'bitte', translationVi: 'làm ơn' },
      { word: 'mit', translationVi: 'với' },
    ],
    difficultyForVi: 'low',
  },
  {
    ipa: 'ɔ',
    nameVi: 'o ngắn (mở)',
    nameDe: 'kurzes o',
    category: 'vowel-short',
    spellings: ['o'],
    tipVi: 'Mở miệng rộng hơn "ô", gần với "o" trong "con".',
    examples: [
      { word: 'Sonne', translationVi: 'mặt trời' },
      { word: 'kommen', translationVi: 'đến' },
      { word: 'noch', translationVi: 'vẫn còn' },
    ],
    difficultyForVi: 'low',
  },
  {
    ipa: 'ʊ',
    nameVi: 'u ngắn',
    nameDe: 'kurzes u',
    category: 'vowel-short',
    spellings: ['u'],
    tipVi: 'Ngắn và hơi mở hơn "u" dài. Tương tự "u" trong "cũng".',
    examples: [
      { word: 'Mutter', translationVi: 'mẹ' },
      { word: 'und', translationVi: 'và' },
      { word: 'Hund', translationVi: 'con chó' },
    ],
    difficultyForVi: 'low',
  },
  {
    ipa: 'ʏ',
    nameVi: 'ü ngắn',
    nameDe: 'kurzes ü',
    category: 'vowel-short',
    spellings: ['ü', 'y'],
    tipVi: 'Đặt lưỡi như khi nói "i" nhưng tròn môi như khi nói "u". Không có trong tiếng Việt.',
    examples: [
      { word: 'fünf', translationVi: 'năm (5)' },
      { word: 'müssen', translationVi: 'phải' },
      { word: 'Glück', translationVi: 'may mắn' },
    ],
    drillPhonemeKey: 'ue',
    difficultyForVi: 'high',
  },
  {
    ipa: 'œ',
    nameVi: 'ö ngắn',
    nameDe: 'kurzes ö',
    category: 'vowel-short',
    spellings: ['ö'],
    tipVi: 'Đặt lưỡi như khi nói "ê" nhưng tròn môi. Không có trong tiếng Việt.',
    examples: [
      { word: 'können', translationVi: 'có thể' },
      { word: 'zwölf', translationVi: 'mười hai' },
      { word: 'öffnen', translationVi: 'mở' },
    ],
    drillPhonemeKey: 'oe',
    difficultyForVi: 'high',
  },
  {
    ipa: 'ə',
    nameVi: 'schwa (e mờ)',
    nameDe: 'Schwa',
    category: 'vowel-short',
    spellings: ['e'],
    tipVi: 'Âm trung tính, rất nhẹ — như "ơ" cực ngắn. Thường gặp ở âm cuối -e, -en.',
    examples: [
      { word: 'bitte', translationVi: 'làm ơn' },
      { word: 'Name', translationVi: 'tên' },
      { word: 'gehen', translationVi: 'đi' },
    ],
    difficultyForVi: 'medium',
  },
  {
    ipa: 'ɐ',
    nameVi: 'a mờ cuối (vocalic-r)',
    nameDe: 'vokalisches r',
    category: 'vowel-short',
    spellings: ['-er', '-r'],
    tipVi: 'Khi -r đứng cuối, phát âm gần như "ơ" mở. KHÔNG cuốn lưỡi như tiếng Việt.',
    examples: [
      { word: 'Mutter', translationVi: 'mẹ' },
      { word: 'Vater', translationVi: 'cha' },
      { word: 'aber', translationVi: 'nhưng' },
    ],
    drillPhonemeKey: 'r',
    difficultyForVi: 'high',
  },

  // ── Long vowels ────────────────────────────────────────────────
  {
    ipa: 'aː',
    nameVi: 'a dài',
    nameDe: 'langes a',
    category: 'vowel-long',
    spellings: ['a', 'aa', 'ah'],
    tipVi: 'Giống "a" tiếng Việt nhưng kéo dài rõ rệt.',
    examples: [
      { word: 'Vater', translationVi: 'cha' },
      { word: 'Sahne', translationVi: 'kem tươi' },
      { word: 'Bahn', translationVi: 'tàu/đường' },
    ],
    difficultyForVi: 'low',
  },
  {
    ipa: 'eː',
    nameVi: 'ê dài (đóng)',
    nameDe: 'langes e',
    category: 'vowel-long',
    spellings: ['e', 'ee', 'eh'],
    tipVi: 'Giống "ê" tiếng Việt, kéo dài và miệng hơi mở.',
    examples: [
      { word: 'gehen', translationVi: 'đi' },
      { word: 'See', translationVi: 'hồ/biển' },
      { word: 'Mehl', translationVi: 'bột mì' },
    ],
    difficultyForVi: 'low',
  },
  {
    ipa: 'ɛː',
    nameVi: 'ä dài',
    nameDe: 'langes ä',
    category: 'vowel-long',
    spellings: ['ä', 'äh'],
    tipVi: 'Như "e" mở (/ɛ/) nhưng kéo dài. Trong nhiều vùng được phát âm gần như "ê" dài.',
    examples: [
      { word: 'Käse', translationVi: 'phô mai' },
      { word: 'spät', translationVi: 'muộn' },
      { word: 'Mädchen', translationVi: 'cô gái' },
    ],
    difficultyForVi: 'medium',
  },
  {
    ipa: 'iː',
    nameVi: 'i dài',
    nameDe: 'langes i',
    category: 'vowel-long',
    spellings: ['ie', 'i', 'ih'],
    tipVi: 'Giống "i" tiếng Việt, kéo dài. Chú ý: "ie" luôn đọc "i" dài, KHÔNG đọc "ai".',
    examples: [
      { word: 'Liebe', translationVi: 'tình yêu' },
      { word: 'sieben', translationVi: 'bảy (7)' },
      { word: 'Bier', translationVi: 'bia' },
    ],
    drillPhonemeKey: 'ei-ie',
    difficultyForVi: 'medium',
  },
  {
    ipa: 'oː',
    nameVi: 'ô dài',
    nameDe: 'langes o',
    category: 'vowel-long',
    spellings: ['o', 'oo', 'oh'],
    tipVi: 'Giống "ô" tiếng Việt, tròn môi rõ và kéo dài.',
    examples: [
      { word: 'Boot', translationVi: 'thuyền' },
      { word: 'wohnen', translationVi: 'cư trú' },
      { word: 'rot', translationVi: 'đỏ' },
    ],
    difficultyForVi: 'low',
  },
  {
    ipa: 'uː',
    nameVi: 'u dài',
    nameDe: 'langes u',
    category: 'vowel-long',
    spellings: ['u', 'uh'],
    tipVi: 'Giống "u" tiếng Việt nhưng tròn môi rất rõ và kéo dài.',
    examples: [
      { word: 'gut', translationVi: 'tốt' },
      { word: 'Buch', translationVi: 'sách' },
      { word: 'Schule', translationVi: 'trường học' },
    ],
    difficultyForVi: 'low',
  },
  {
    ipa: 'yː',
    nameVi: 'ü dài',
    nameDe: 'langes ü',
    category: 'vowel-long',
    spellings: ['ü', 'üh', 'y'],
    tipVi: 'Như /ʏ/ ngắn nhưng kéo dài: lưỡi vị trí "i", môi tròn như "u". Không có trong tiếng Việt.',
    examples: [
      { word: 'Tür', translationVi: 'cửa' },
      { word: 'müde', translationVi: 'mệt' },
      { word: 'früh', translationVi: 'sớm' },
    ],
    drillPhonemeKey: 'ue',
    difficultyForVi: 'high',
  },
  {
    ipa: 'øː',
    nameVi: 'ö dài',
    nameDe: 'langes ö',
    category: 'vowel-long',
    spellings: ['ö', 'öh'],
    tipVi: 'Như /œ/ ngắn nhưng kéo dài: lưỡi vị trí "ê", môi tròn như "ô". Không có trong tiếng Việt.',
    examples: [
      { word: 'schön', translationVi: 'đẹp' },
      { word: 'hören', translationVi: 'nghe' },
      { word: 'Söhne', translationVi: 'các con trai' },
    ],
    drillPhonemeKey: 'oe',
    difficultyForVi: 'high',
  },

  // ── Diphthongs ─────────────────────────────────────────────────
  {
    ipa: 'aɪ',
    nameVi: 'âm đôi "ai"',
    nameDe: 'Diphthong ai',
    category: 'diphthong',
    spellings: ['ei', 'ai', 'ey', 'ay'],
    tipVi: 'Đọc gần như "ai" tiếng Việt. Chú ý: "ei" KHÔNG đọc là "i".',
    examples: [
      { word: 'ein', translationVi: 'một' },
      { word: 'mein', translationVi: 'của tôi' },
      { word: 'Mai', translationVi: 'tháng năm' },
    ],
    drillPhonemeKey: 'ei-ie',
    difficultyForVi: 'medium',
  },
  {
    ipa: 'aʊ',
    nameVi: 'âm đôi "ao"',
    nameDe: 'Diphthong au',
    category: 'diphthong',
    spellings: ['au'],
    tipVi: 'Đọc gần như "ao" tiếng Việt, kết thúc với môi tròn.',
    examples: [
      { word: 'Haus', translationVi: 'ngôi nhà' },
      { word: 'Frau', translationVi: 'phụ nữ/bà' },
      { word: 'kaufen', translationVi: 'mua' },
    ],
    drillPhonemeKey: 'eu-au',
    difficultyForVi: 'medium',
  },
  {
    ipa: 'ɔʏ',
    nameVi: 'âm đôi "oi"',
    nameDe: 'Diphthong eu/äu',
    category: 'diphthong',
    spellings: ['eu', 'äu'],
    tipVi: 'Đọc gần như "oi" tiếng Việt. Cả "eu" và "äu" cùng đọc /ɔʏ/.',
    examples: [
      { word: 'neu', translationVi: 'mới' },
      { word: 'Häuser', translationVi: 'các ngôi nhà' },
      { word: 'Freund', translationVi: 'bạn' },
    ],
    drillPhonemeKey: 'eu-au',
    difficultyForVi: 'medium',
  },

  // ── Consonants ─────────────────────────────────────────────────
  {
    ipa: 'p',
    nameVi: 'p (vô thanh)',
    nameDe: 'p',
    category: 'consonant',
    spellings: ['p', 'pp', 'b (cuối từ)'],
    tipVi: 'Bật hơi mạnh hơn "p" tiếng Việt. Lưu ý "b" cuối từ cũng đọc /p/.',
    examples: [
      { word: 'Papa', translationVi: 'bố' },
      { word: 'Lob', translationVi: 'lời khen' },
      { word: 'gelb', translationVi: 'màu vàng' },
    ],
    difficultyForVi: 'low',
  },
  {
    ipa: 'b',
    nameVi: 'b (hữu thanh)',
    nameDe: 'b',
    category: 'consonant',
    spellings: ['b', 'bb'],
    tipVi: 'Giống "b" tiếng Việt. Cuối từ chuyển thành /p/.',
    examples: [
      { word: 'Bier', translationVi: 'bia' },
      { word: 'aber', translationVi: 'nhưng' },
      { word: 'lieben', translationVi: 'yêu' },
    ],
    difficultyForVi: 'low',
  },
  {
    ipa: 't',
    nameVi: 't (vô thanh)',
    nameDe: 't',
    category: 'consonant',
    spellings: ['t', 'tt', 'th', 'd (cuối từ)'],
    tipVi: 'Bật hơi mạnh hơn "t" tiếng Việt. "d" cuối từ cũng đọc /t/.',
    examples: [
      { word: 'Tag', translationVi: 'ngày' },
      { word: 'Bett', translationVi: 'giường' },
      { word: 'Hand', translationVi: 'bàn tay' },
    ],
    difficultyForVi: 'low',
  },
  {
    ipa: 'd',
    nameVi: 'd (hữu thanh)',
    nameDe: 'd',
    category: 'consonant',
    spellings: ['d', 'dd'],
    tipVi: 'Giống "đ" tiếng Việt. Cuối từ chuyển thành /t/.',
    examples: [
      { word: 'danke', translationVi: 'cảm ơn' },
      { word: 'Dame', translationVi: 'quý cô' },
      { word: 'oder', translationVi: 'hoặc' },
    ],
    difficultyForVi: 'low',
  },
  {
    ipa: 'k',
    nameVi: 'k (vô thanh)',
    nameDe: 'k',
    category: 'consonant',
    spellings: ['k', 'ck', 'g (cuối từ)', 'ch (gốc Hy Lạp)'],
    tipVi: 'Bật hơi mạnh hơn "k" tiếng Việt. "g" cuối từ thường chuyển thành /k/.',
    examples: [
      { word: 'Kind', translationVi: 'đứa trẻ' },
      { word: 'Tag', translationVi: 'ngày' },
      { word: 'Glück', translationVi: 'may mắn' },
    ],
    difficultyForVi: 'low',
  },
  {
    ipa: 'g',
    nameVi: 'g (hữu thanh)',
    nameDe: 'g',
    category: 'consonant',
    spellings: ['g', 'gg'],
    tipVi: 'Giống "g" cứng tiếng Việt (như trong "ga"). Cuối từ chuyển thành /k/.',
    examples: [
      { word: 'gut', translationVi: 'tốt' },
      { word: 'gehen', translationVi: 'đi' },
      { word: 'Auge', translationVi: 'mắt' },
    ],
    difficultyForVi: 'low',
  },
  {
    ipa: 'f',
    nameVi: 'f',
    nameDe: 'f',
    category: 'consonant',
    spellings: ['f', 'ff', 'v', 'ph'],
    tipVi: 'Giống "ph" tiếng Việt. Đa số chữ "v" trong tiếng Đức cũng đọc /f/.',
    examples: [
      { word: 'Vater', translationVi: 'cha' },
      { word: 'fünf', translationVi: 'năm (5)' },
      { word: 'Hoffnung', translationVi: 'hy vọng' },
    ],
    difficultyForVi: 'low',
  },
  {
    ipa: 'v',
    nameVi: 'v (hữu thanh)',
    nameDe: 'w',
    category: 'consonant',
    spellings: ['w', 'v (từ mượn)'],
    tipVi: 'Giống "v" tiếng Việt. Chữ "w" trong tiếng Đức đọc /v/.',
    examples: [
      { word: 'Wasser', translationVi: 'nước' },
      { word: 'Wein', translationVi: 'rượu vang' },
      { word: 'Vase', translationVi: 'lọ hoa' },
    ],
    difficultyForVi: 'low',
  },
  {
    ipa: 's',
    nameVi: 's (vô thanh)',
    nameDe: 'stimmloses s',
    category: 'consonant',
    spellings: ['ss', 'ß', 's (cuối từ)'],
    tipVi: 'Giống "x" tiếng Việt (như trong "xa"). ß = ss, luôn vô thanh.',
    examples: [
      { word: 'Wasser', translationVi: 'nước' },
      { word: 'Straße', translationVi: 'đường phố' },
      { word: 'aus', translationVi: 'từ/ra ngoài' },
    ],
    drillPhonemeKey: 'ss',
    difficultyForVi: 'medium',
  },
  {
    ipa: 'z',
    nameVi: 's (hữu thanh)',
    nameDe: 'stimmhaftes s',
    category: 'consonant',
    spellings: ['s (đầu từ trước nguyên âm)'],
    tipVi: 'Rung dây thanh khi nói "s". Giống âm "z" tiếng Anh trong "zoo".',
    examples: [
      { word: 'Sonne', translationVi: 'mặt trời' },
      { word: 'sehen', translationVi: 'nhìn' },
      { word: 'sieben', translationVi: 'bảy' },
    ],
    drillPhonemeKey: 'ss',
    difficultyForVi: 'medium',
  },
  {
    ipa: 'ʃ',
    nameVi: 'sch',
    nameDe: 'sch',
    category: 'consonant',
    spellings: ['sch', 'st- (đầu từ)', 'sp- (đầu từ)'],
    tipVi: 'Như "s" tiếng Anh trong "she". Tròn môi nhẹ. "st", "sp" đầu từ cũng đọc /ʃt/, /ʃp/.',
    examples: [
      { word: 'Schule', translationVi: 'trường học' },
      { word: 'Stuhl', translationVi: 'ghế' },
      { word: 'sprechen', translationVi: 'nói' },
    ],
    difficultyForVi: 'medium',
  },
  {
    ipa: 'ʒ',
    nameVi: 'zh (từ mượn)',
    nameDe: 'g (Fremdwort)',
    category: 'consonant',
    spellings: ['g (từ tiếng Pháp)', 'j (từ tiếng Pháp)'],
    tipVi: 'Hữu thanh của /ʃ/. Hiếm gặp, chỉ ở từ mượn tiếng Pháp.',
    examples: [
      { word: 'Garage', translationVi: 'nhà để xe' },
      { word: 'Journal', translationVi: 'báo/nhật ký' },
      { word: 'Genie', translationVi: 'thiên tài' },
    ],
    difficultyForVi: 'medium',
  },
  {
    ipa: 'ç',
    nameVi: 'ch mềm (ich-Laut)',
    nameDe: 'ich-Laut',
    category: 'consonant',
    spellings: ['ch (sau i, e, ä, ö, ü, l, n, r)', '-ig (cuối từ)'],
    tipVi: 'Đặt lưỡi như nói "i", đẩy hơi ra qua khe hẹp. KHÔNG đọc giống "sch".',
    examples: [
      { word: 'ich', translationVi: 'tôi' },
      { word: 'nicht', translationVi: 'không' },
      { word: 'richtig', translationVi: 'đúng' },
    ],
    drillPhonemeKey: 'ch-ich',
    difficultyForVi: 'high',
  },
  {
    ipa: 'x',
    nameVi: 'ch cứng (ach-Laut)',
    nameDe: 'ach-Laut',
    category: 'consonant',
    spellings: ['ch (sau a, o, u, au)'],
    tipVi: 'Đẩy hơi mạnh ra từ cuống lưỡi, gần giống "kh" tiếng Việt nhưng sâu hơn.',
    examples: [
      { word: 'Buch', translationVi: 'sách' },
      { word: 'machen', translationVi: 'làm' },
      { word: 'auch', translationVi: 'cũng' },
    ],
    drillPhonemeKey: 'ch-ach',
    difficultyForVi: 'medium',
  },
  {
    ipa: 'h',
    nameVi: 'h (chỉ đầu âm tiết)',
    nameDe: 'h',
    category: 'consonant',
    spellings: ['h (đầu từ/đầu âm tiết)'],
    tipVi: 'Giống "h" tiếng Việt. Lưu ý: "h" sau nguyên âm chỉ để kéo dài, KHÔNG đọc.',
    examples: [
      { word: 'haben', translationVi: 'có' },
      { word: 'Haus', translationVi: 'ngôi nhà' },
      { word: 'hören', translationVi: 'nghe' },
    ],
    difficultyForVi: 'low',
  },
  {
    ipa: 'm',
    nameVi: 'm',
    nameDe: 'm',
    category: 'consonant',
    spellings: ['m', 'mm'],
    tipVi: 'Giống "m" tiếng Việt.',
    examples: [
      { word: 'Mutter', translationVi: 'mẹ' },
      { word: 'Mann', translationVi: 'người đàn ông' },
      { word: 'kommen', translationVi: 'đến' },
    ],
    difficultyForVi: 'low',
  },
  {
    ipa: 'n',
    nameVi: 'n',
    nameDe: 'n',
    category: 'consonant',
    spellings: ['n', 'nn'],
    tipVi: 'Giống "n" tiếng Việt.',
    examples: [
      { word: 'nein', translationVi: 'không' },
      { word: 'Name', translationVi: 'tên' },
      { word: 'können', translationVi: 'có thể' },
    ],
    difficultyForVi: 'low',
  },
  {
    ipa: 'ŋ',
    nameVi: 'ng',
    nameDe: 'ng',
    category: 'consonant',
    spellings: ['ng', 'nk (= /ŋk/)'],
    tipVi: 'Giống "ng" tiếng Việt trong "xong". Lưu ý: KHÔNG đọc rời "n" và "g".',
    examples: [
      { word: 'singen', translationVi: 'hát' },
      { word: 'lang', translationVi: 'dài' },
      { word: 'jung', translationVi: 'trẻ' },
    ],
    difficultyForVi: 'low',
  },
  {
    ipa: 'l',
    nameVi: 'l',
    nameDe: 'l',
    category: 'consonant',
    spellings: ['l', 'll'],
    tipVi: 'Giống "l" tiếng Việt nhưng đầu lưỡi đặt sát răng cửa trên.',
    examples: [
      { word: 'Liebe', translationVi: 'tình yêu' },
      { word: 'lernen', translationVi: 'học' },
      { word: 'alles', translationVi: 'tất cả' },
    ],
    difficultyForVi: 'low',
  },
  {
    ipa: 'ʁ',
    nameVi: 'r cuống lưỡi',
    nameDe: 'r (uvular)',
    category: 'consonant',
    spellings: ['r', 'rr', 'rh'],
    tipVi: 'Phát âm ở cuống lưỡi (uvular), KHÔNG rung đầu lưỡi như "r" tiếng Việt.',
    examples: [
      { word: 'rot', translationVi: 'đỏ' },
      { word: 'Reise', translationVi: 'chuyến đi' },
      { word: 'Bruder', translationVi: 'anh/em trai' },
    ],
    drillPhonemeKey: 'r',
    difficultyForVi: 'high',
  },
  {
    ipa: 'j',
    nameVi: 'y/d (nửa nguyên âm)',
    nameDe: 'j',
    category: 'consonant',
    spellings: ['j', 'y (từ mượn)'],
    tipVi: 'Giống "d" miền Nam hoặc "y" tiếng Việt trong "yêu".',
    examples: [
      { word: 'ja', translationVi: 'vâng' },
      { word: 'Junge', translationVi: 'cậu bé' },
      { word: 'jetzt', translationVi: 'bây giờ' },
    ],
    difficultyForVi: 'low',
  },

  // ── Affricates ─────────────────────────────────────────────────
  {
    ipa: 'pf',
    nameVi: 'pf (phụ âm kép)',
    nameDe: 'pf',
    category: 'affricate',
    spellings: ['pf'],
    tipVi: 'Đọc liền /p/ và /f/ — môi khép rồi bật ra thành /f/. Tập riêng vì khó cho người Việt.',
    examples: [
      { word: 'Pferd', translationVi: 'con ngựa' },
      { word: 'Apfel', translationVi: 'quả táo' },
      { word: 'Kopf', translationVi: 'cái đầu' },
    ],
    difficultyForVi: 'high',
  },
  {
    ipa: 'ts',
    nameVi: 'ts (phụ âm kép)',
    nameDe: 'z / tz',
    category: 'affricate',
    spellings: ['z', 'tz', 'c (từ mượn)'],
    tipVi: 'Đọc liền /t/ và /s/. Chú ý: chữ "z" tiếng Đức KHÔNG đọc giống "z" tiếng Anh.',
    examples: [
      { word: 'Zeit', translationVi: 'thời gian' },
      { word: 'zehn', translationVi: 'mười' },
      { word: 'Katze', translationVi: 'con mèo' },
    ],
    difficultyForVi: 'medium',
  },
];

export function getIpaByCategory(category: IpaCategory): IpaSymbol[] {
  return IPA_CHART.filter(s => s.category === category);
}

export interface IpaVideo {
  id: string;
  title: string;
}

export const IPA_VIDEOS: IpaVideo[] = [
  { id: 'mzrLZi6fipA', title: 'Nguyên âm' },
  { id: 'kEHfUKJ_yms', title: 'Phụ âm' },
  { id: 'Pg2NMEONKxk', title: 'Hệ thống chính tả' },
  { id: 'XCJTW-YV-HE', title: 'Luyện tập tổng hợp' },
];
