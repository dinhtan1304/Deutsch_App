/**
 * German Words Seed Data
 * Initial vocabulary for der/die/das learning
 */

import { WordProps } from '../../domain/entities/Word';
import { Gender } from '../../domain/valueObjects/Gender';
import { WordCategory } from '../../domain/valueObjects/WordCategory';
import { CEFRLevel } from '../../domain/valueObjects/CEFRLevel';

type SeedWord = Omit<WordProps, 'createdAt' | 'updatedAt'>;

/**
 * Create a seed word with defaults
 */
function createWord(
  id: string,
  word: string,
  gender: Gender,
  translationEN: string,
  translationVI: string,
  category: WordCategory,
  level: CEFRLevel,
  options: Partial<{
    plural: string;
    examples: string[];
    tips: string[];
    frequency: number;
    tags: string[];
    pronunciation: string;
    imageUrl: string;
  }> = {}
): SeedWord {
  return {
    id,
    word,
    gender,
    plural: options.plural ?? null,
    translations: {
      en: translationEN,
      vi: translationVI
    },
    pronunciation: options.pronunciation,
    imageUrl: options.imageUrl,
    examples: options.examples ?? [],
    tips: options.tips ?? [],
    category,
    level,
    frequency: options.frequency ?? 3,
    tags: options.tags ?? []
  };
}

export const SEED_WORDS: SeedWord[] = [
  // ============ FOOD & DRINKS ============
  createWord('w001', 'Apfel', 'masculine', 'apple', 'quả táo', 'food', 'A1', {
    plural: 'Äpfel',
    frequency: 1,
    examples: ['Der Apfel ist rot.', 'Ich esse einen Apfel.'],
    tips: ['Think of "Apple" - both start with A, der Apfel'],
    tags: ['fruit', 'healthy'],
    pronunciation: 'ˈapfəl',
    imageUrl: 'https://images.unsplash.com/photo-1584306670957-acf935f5033c?w=200&h=200&fit=crop'
  }),
  createWord('w002', 'Banane', 'feminine', 'banana', 'quả chuối', 'food', 'A1', {
    plural: 'Bananen',
    frequency: 1,
    examples: ['Die Banane ist gelb.', 'Ich mag Bananen.'],
    tips: ['Words ending in -e are often feminine'],
    tags: ['fruit'],
    pronunciation: 'baˈnaːnə',
    imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=200&h=200&fit=crop'
  }),
  createWord('w003', 'Brot', 'neuter', 'bread', 'bánh mì', 'food', 'A1', {
    plural: 'Brote',
    frequency: 1,
    examples: ['Das Brot ist frisch.', 'Ich kaufe ein Brot.'],
    tags: ['bakery', 'breakfast'],
    pronunciation: 'broːt',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&h=200&fit=crop'
  }),
  createWord('w004', 'Wasser', 'neuter', 'water', 'nước', 'food', 'A1', {
    plural: 'Wasser',
    frequency: 1,
    examples: ['Das Wasser ist kalt.', 'Ich trinke Wasser.'],
    tags: ['drink', 'essential'],
    pronunciation: 'ˈvasɐ',
    imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=200&h=200&fit=crop'
  }),
  createWord('w005', 'Kaffee', 'masculine', 'coffee', 'cà phê', 'food', 'A1', {
    plural: 'Kaffees',
    frequency: 1,
    examples: ['Der Kaffee ist heiß.', 'Ich brauche einen Kaffee.'],
    tags: ['drink', 'hot'],
    pronunciation: 'ˈkafe',
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&h=200&fit=crop'
  }),
  createWord('w006', 'Milch', 'feminine', 'milk', 'sữa', 'food', 'A1', {
    frequency: 1,
    examples: ['Die Milch ist frisch.', 'Ich trinke Milch.'],
    tags: ['drink', 'dairy'],
    pronunciation: 'mɪlç'
  }),
  createWord('w007', 'Ei', 'neuter', 'egg', 'trứng', 'food', 'A1', {
    plural: 'Eier',
    frequency: 1,
    examples: ['Das Ei ist gekocht.', 'Ich esse ein Ei zum Frühstück.'],
    tags: ['breakfast', 'protein'],
    pronunciation: 'aɪ'
  }),
  createWord('w008', 'Fleisch', 'neuter', 'meat', 'thịt', 'food', 'A1', {
    frequency: 2,
    examples: ['Das Fleisch ist teuer.', 'Ich esse kein Fleisch.'],
    tags: ['protein'],
    pronunciation: 'flaɪʃ'
  }),
  createWord('w009', 'Käse', 'masculine', 'cheese', 'phô mai', 'food', 'A1', {
    frequency: 2,
    examples: ['Der Käse schmeckt gut.', 'Ich kaufe Käse.'],
    tags: ['dairy'],
    pronunciation: 'ˈkɛːzə'
  }),
  createWord('w010', 'Suppe', 'feminine', 'soup', 'súp', 'food', 'A1', {
    plural: 'Suppen',
    frequency: 2,
    examples: ['Die Suppe ist warm.', 'Ich koche eine Suppe.'],
    tips: ['Words ending in -e are often feminine'],
    tags: ['hot', 'meal'],
    pronunciation: 'ˈzʊpə'
  }),

  // ============ ANIMALS ============
  createWord('w011', 'Hund', 'masculine', 'dog', 'con chó', 'animals', 'A1', {
    plural: 'Hunde',
    frequency: 1,
    examples: ['Der Hund bellt.', 'Ich habe einen Hund.'],
    tags: ['pet', 'common'],
    pronunciation: 'hʊnt',
    imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop'
  }),
  createWord('w012', 'Katze', 'feminine', 'cat', 'con mèo', 'animals', 'A1', {
    plural: 'Katzen',
    frequency: 1,
    examples: ['Die Katze schläft.', 'Meine Katze ist schwarz.'],
    tips: ['Words ending in -e are often feminine'],
    tags: ['pet', 'common'],
    pronunciation: 'ˈkatsə',
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&h=200&fit=crop'
  }),
  createWord('w013', 'Vogel', 'masculine', 'bird', 'con chim', 'animals', 'A1', {
    plural: 'Vögel',
    frequency: 2,
    examples: ['Der Vogel singt.', 'Ich sehe einen Vogel.'],
    tags: ['wild', 'flying'],
    pronunciation: 'ˈfoːɡl̩'
  }),
  createWord('w014', 'Fisch', 'masculine', 'fish', 'con cá', 'animals', 'A1', {
    plural: 'Fische',
    frequency: 2,
    examples: ['Der Fisch schwimmt.', 'Ich esse Fisch.'],
    tags: ['water', 'pet', 'food'],
    pronunciation: 'fɪʃ'
  }),
  createWord('w015', 'Pferd', 'neuter', 'horse', 'con ngựa', 'animals', 'A1', {
    plural: 'Pferde',
    frequency: 2,
    examples: ['Das Pferd läuft schnell.', 'Ich reite ein Pferd.'],
    tags: ['farm'],
    pronunciation: 'pfeːɐ̯t'
  }),
  createWord('w016', 'Maus', 'feminine', 'mouse', 'con chuột', 'animals', 'A1', {
    plural: 'Mäuse',
    frequency: 2,
    examples: ['Die Maus ist klein.', 'Die Katze fängt die Maus.'],
    tags: ['small', 'wild'],
    pronunciation: 'maʊs'
  }),
  createWord('w017', 'Schwein', 'neuter', 'pig', 'con lợn', 'animals', 'A2', {
    plural: 'Schweine',
    frequency: 2,
    examples: ['Das Schwein ist rosa.', 'Das Schwein lebt auf dem Bauernhof.'],
    tags: ['farm'],
    pronunciation: 'ʃvaɪn'
  }),
  createWord('w018', 'Kuh', 'feminine', 'cow', 'con bò', 'animals', 'A2', {
    plural: 'Kühe',
    frequency: 2,
    examples: ['Die Kuh gibt Milch.', 'Die Kuh steht auf der Weide.'],
    tags: ['farm', 'dairy'],
    pronunciation: 'kuː'
  }),

  // ============ FAMILY ============
  createWord('w019', 'Mutter', 'feminine', 'mother', 'mẹ', 'family', 'A1', {
    plural: 'Mütter',
    frequency: 1,
    examples: ['Meine Mutter kocht gut.', 'Die Mutter liebt ihre Kinder.'],
    tags: ['parent', 'female'],
    pronunciation: 'ˈmʊtɐ'
  }),
  createWord('w020', 'Vater', 'masculine', 'father', 'bố', 'family', 'A1', {
    plural: 'Väter',
    frequency: 1,
    examples: ['Mein Vater arbeitet viel.', 'Der Vater spielt mit den Kindern.'],
    tags: ['parent', 'male'],
    pronunciation: 'ˈfaːtɐ'
  }),
  createWord('w021', 'Kind', 'neuter', 'child', 'đứa trẻ', 'family', 'A1', {
    plural: 'Kinder',
    frequency: 1,
    examples: ['Das Kind spielt.', 'Ich habe zwei Kinder.'],
    tags: ['young'],
    pronunciation: 'kɪnt'
  }),
  createWord('w022', 'Bruder', 'masculine', 'brother', 'anh/em trai', 'family', 'A1', {
    plural: 'Brüder',
    frequency: 1,
    examples: ['Mein Bruder ist älter.', 'Ich habe einen Bruder.'],
    tags: ['sibling', 'male'],
    pronunciation: 'ˈbruːdɐ'
  }),
  createWord('w023', 'Schwester', 'feminine', 'sister', 'chị/em gái', 'family', 'A1', {
    plural: 'Schwestern',
    frequency: 1,
    examples: ['Meine Schwester studiert.', 'Ich habe eine Schwester.'],
    tags: ['sibling', 'female'],
    pronunciation: 'ˈʃvɛstɐ'
  }),
  createWord('w024', 'Großmutter', 'feminine', 'grandmother', 'bà', 'family', 'A1', {
    plural: 'Großmütter',
    frequency: 2,
    examples: ['Meine Großmutter backt Kuchen.', 'Die Großmutter erzählt Geschichten.'],
    tips: ['Compound word: Groß (big/grand) + Mutter (mother)'],
    tags: ['grandparent', 'female'],
    pronunciation: 'ˈɡroːsmʊtɐ'
  }),
  createWord('w025', 'Großvater', 'masculine', 'grandfather', 'ông', 'family', 'A1', {
    plural: 'Großväter',
    frequency: 2,
    examples: ['Mein Großvater ist 80 Jahre alt.', 'Der Großvater liest die Zeitung.'],
    tips: ['Compound word: Groß (big/grand) + Vater (father)'],
    tags: ['grandparent', 'male'],
    pronunciation: 'ˈɡroːsfaːtɐ'
  }),

  // ============ HOME ============
  createWord('w026', 'Haus', 'neuter', 'house', 'nhà', 'home', 'A1', {
    plural: 'Häuser',
    frequency: 1,
    examples: ['Das Haus ist groß.', 'Ich wohne in einem Haus.'],
    tags: ['building', 'living'],
    pronunciation: 'haʊs'
  }),
  createWord('w027', 'Tür', 'feminine', 'door', 'cửa', 'home', 'A1', {
    plural: 'Türen',
    frequency: 1,
    examples: ['Die Tür ist offen.', 'Bitte schließen Sie die Tür.'],
    tags: ['room', 'entrance'],
    pronunciation: 'tyːɐ̯'
  }),
  createWord('w028', 'Fenster', 'neuter', 'window', 'cửa sổ', 'home', 'A1', {
    plural: 'Fenster',
    frequency: 1,
    examples: ['Das Fenster ist sauber.', 'Ich öffne das Fenster.'],
    tags: ['room'],
    pronunciation: 'ˈfɛnstɐ'
  }),
  createWord('w029', 'Tisch', 'masculine', 'table', 'bàn', 'home', 'A1', {
    plural: 'Tische',
    frequency: 1,
    examples: ['Der Tisch ist aus Holz.', 'Das Buch liegt auf dem Tisch.'],
    tags: ['furniture'],
    pronunciation: 'tɪʃ'
  }),
  createWord('w030', 'Stuhl', 'masculine', 'chair', 'ghế', 'home', 'A1', {
    plural: 'Stühle',
    frequency: 1,
    examples: ['Der Stuhl ist bequem.', 'Bitte setzen Sie sich auf den Stuhl.'],
    tags: ['furniture', 'seating'],
    pronunciation: 'ʃtuːl'
  }),
  createWord('w031', 'Bett', 'neuter', 'bed', 'giường', 'home', 'A1', {
    plural: 'Betten',
    frequency: 1,
    examples: ['Das Bett ist weich.', 'Ich gehe ins Bett.'],
    tags: ['furniture', 'bedroom'],
    pronunciation: 'bɛt'
  }),
  createWord('w032', 'Küche', 'feminine', 'kitchen', 'nhà bếp', 'home', 'A1', {
    plural: 'Küchen',
    frequency: 1,
    examples: ['Die Küche ist modern.', 'Ich koche in der Küche.'],
    tips: ['Words ending in -e are often feminine'],
    tags: ['room'],
    pronunciation: 'ˈkʏçə'
  }),
  createWord('w033', 'Zimmer', 'neuter', 'room', 'phòng', 'home', 'A1', {
    plural: 'Zimmer',
    frequency: 1,
    examples: ['Das Zimmer ist hell.', 'Mein Zimmer ist ordentlich.'],
    tags: ['space'],
    pronunciation: 'ˈtsɪmɐ'
  }),
  createWord('w034', 'Bad', 'neuter', 'bathroom', 'phòng tắm', 'home', 'A1', {
    plural: 'Bäder',
    frequency: 1,
    examples: ['Das Bad ist klein.', 'Ich gehe ins Bad.'],
    tags: ['room'],
    pronunciation: 'baːt'
  }),
  createWord('w035', 'Wohnung', 'feminine', 'apartment', 'căn hộ', 'home', 'A1', {
    plural: 'Wohnungen',
    frequency: 1,
    examples: ['Die Wohnung hat drei Zimmer.', 'Ich suche eine Wohnung.'],
    tips: ['Words ending in -ung are always feminine'],
    tags: ['building', 'living'],
    pronunciation: 'ˈvoːnʊŋ'
  }),

  // ============ BODY ============
  createWord('w036', 'Kopf', 'masculine', 'head', 'đầu', 'body', 'A1', {
    plural: 'Köpfe',
    frequency: 1,
    examples: ['Mein Kopf tut weh.', 'Der Kopf ist rund.'],
    tags: ['upper body'],
    pronunciation: 'kɔpf'
  }),
  createWord('w037', 'Hand', 'feminine', 'hand', 'tay', 'body', 'A1', {
    plural: 'Hände',
    frequency: 1,
    examples: ['Die Hand hat fünf Finger.', 'Gib mir deine Hand.'],
    tags: ['arm'],
    pronunciation: 'hant'
  }),
  createWord('w038', 'Auge', 'neuter', 'eye', 'mắt', 'body', 'A1', {
    plural: 'Augen',
    frequency: 1,
    examples: ['Das Auge ist blau.', 'Ich habe braune Augen.'],
    tags: ['face', 'sense'],
    pronunciation: 'ˈaʊɡə'
  }),
  createWord('w039', 'Ohr', 'neuter', 'ear', 'tai', 'body', 'A1', {
    plural: 'Ohren',
    frequency: 2,
    examples: ['Das Ohr hört gut.', 'Ich habe zwei Ohren.'],
    tags: ['face', 'sense'],
    pronunciation: 'oːɐ̯'
  }),
  createWord('w040', 'Nase', 'feminine', 'nose', 'mũi', 'body', 'A1', {
    plural: 'Nasen',
    frequency: 2,
    examples: ['Die Nase ist klein.', 'Meine Nase ist verstopft.'],
    tips: ['Words ending in -e are often feminine'],
    tags: ['face', 'sense'],
    pronunciation: 'ˈnaːzə'
  }),
  createWord('w041', 'Mund', 'masculine', 'mouth', 'miệng', 'body', 'A1', {
    plural: 'Münder',
    frequency: 2,
    examples: ['Der Mund ist offen.', 'Mach den Mund auf.'],
    tags: ['face'],
    pronunciation: 'mʊnt'
  }),
  createWord('w042', 'Herz', 'neuter', 'heart', 'tim', 'body', 'A1', {
    plural: 'Herzen',
    frequency: 2,
    examples: ['Das Herz schlägt.', 'Mein Herz ist voll Liebe.'],
    tags: ['organ', 'emotion'],
    pronunciation: 'hɛʁts'
  }),
  createWord('w043', 'Fuß', 'masculine', 'foot', 'bàn chân', 'body', 'A1', {
    plural: 'Füße',
    frequency: 2,
    examples: ['Der Fuß ist groß.', 'Ich gehe zu Fuß.'],
    tags: ['leg'],
    pronunciation: 'fuːs'
  }),

  // ============ WORK & EDUCATION ============
  createWord('w044', 'Buch', 'neuter', 'book', 'sách', 'education', 'A1', {
    plural: 'Bücher',
    frequency: 1,
    examples: ['Das Buch ist interessant.', 'Ich lese ein Buch.'],
    tags: ['reading', 'study'],
    pronunciation: 'buːx'
  }),
  createWord('w045', 'Schule', 'feminine', 'school', 'trường học', 'education', 'A1', {
    plural: 'Schulen',
    frequency: 1,
    examples: ['Die Schule beginnt um 8 Uhr.', 'Ich gehe zur Schule.'],
    tips: ['Words ending in -e are often feminine'],
    tags: ['building', 'learning'],
    pronunciation: 'ˈʃuːlə'
  }),
  createWord('w046', 'Lehrer', 'masculine', 'teacher (male)', 'thầy giáo', 'work', 'A1', {
    plural: 'Lehrer',
    frequency: 1,
    examples: ['Der Lehrer erklärt die Aufgabe.', 'Mein Lehrer ist nett.'],
    tags: ['profession', 'male'],
    pronunciation: 'ˈleːʁɐ'
  }),
  createWord('w047', 'Lehrerin', 'feminine', 'teacher (female)', 'cô giáo', 'work', 'A1', {
    plural: 'Lehrerinnen',
    frequency: 1,
    examples: ['Die Lehrerin korrigiert die Tests.', 'Unsere Lehrerin ist streng.'],
    tips: ['Words ending in -in are always feminine (female profession)'],
    tags: ['profession', 'female'],
    pronunciation: 'ˈleːʁəʁɪn'
  }),
  createWord('w048', 'Arbeit', 'feminine', 'work', 'công việc', 'work', 'A1', {
    plural: 'Arbeiten',
    frequency: 1,
    examples: ['Die Arbeit ist schwer.', 'Ich gehe zur Arbeit.'],
    tags: ['job'],
    pronunciation: 'ˈaʁbaɪt'
  }),
  createWord('w049', 'Büro', 'neuter', 'office', 'văn phòng', 'work', 'A1', {
    plural: 'Büros',
    frequency: 2,
    examples: ['Das Büro ist im dritten Stock.', 'Ich arbeite im Büro.'],
    tags: ['workplace', 'building'],
    pronunciation: 'byˈʁoː'
  }),
  createWord('w050', 'Computer', 'masculine', 'computer', 'máy tính', 'technology', 'A1', {
    plural: 'Computer',
    frequency: 1,
    examples: ['Der Computer ist neu.', 'Ich arbeite am Computer.'],
    tags: ['device', 'work'],
    pronunciation: 'kɔmˈpjuːtɐ'
  }),

  // ============ TRAVEL & TRANSPORT ============
  createWord('w051', 'Auto', 'neuter', 'car', 'xe hơi', 'travel', 'A1', {
    plural: 'Autos',
    frequency: 1,
    examples: ['Das Auto ist schnell.', 'Ich fahre mit dem Auto.'],
    tags: ['vehicle'],
    pronunciation: 'ˈaʊto'
  }),
  createWord('w052', 'Zug', 'masculine', 'train', 'tàu hỏa', 'travel', 'A1', {
    plural: 'Züge',
    frequency: 1,
    examples: ['Der Zug kommt pünktlich.', 'Ich fahre mit dem Zug.'],
    tags: ['vehicle', 'public transport'],
    pronunciation: 'tsuːk'
  }),
  createWord('w053', 'Flugzeug', 'neuter', 'airplane', 'máy bay', 'travel', 'A1', {
    plural: 'Flugzeuge',
    frequency: 2,
    examples: ['Das Flugzeug landet.', 'Ich fliege mit dem Flugzeug.'],
    tips: ['Compound word: Flug (flight) + Zeug (thing)'],
    tags: ['vehicle', 'flying'],
    pronunciation: 'ˈfluːkˌtsɔɪk'
  }),
  createWord('w054', 'Fahrrad', 'neuter', 'bicycle', 'xe đạp', 'travel', 'A1', {
    plural: 'Fahrräder',
    frequency: 2,
    examples: ['Das Fahrrad ist rot.', 'Ich fahre Fahrrad.'],
    tips: ['Compound word: Fahr (drive) + Rad (wheel)'],
    tags: ['vehicle', 'sport'],
    pronunciation: 'ˈfaːɐ̯ˌʁaːt'
  }),
  createWord('w055', 'Straße', 'feminine', 'street', 'đường phố', 'travel', 'A1', {
    plural: 'Straßen',
    frequency: 1,
    examples: ['Die Straße ist lang.', 'Ich wohne in dieser Straße.'],
    tips: ['Words ending in -e are often feminine'],
    tags: ['city', 'direction'],
    pronunciation: 'ˈʃtʁaːsə'
  }),
  createWord('w056', 'Stadt', 'feminine', 'city', 'thành phố', 'travel', 'A1', {
    plural: 'Städte',
    frequency: 1,
    examples: ['Die Stadt ist schön.', 'Berlin ist eine große Stadt.'],
    tags: ['place'],
    pronunciation: 'ʃtat'
  }),

  // ============ NATURE & WEATHER ============
  createWord('w057', 'Baum', 'masculine', 'tree', 'cây', 'nature', 'A1', {
    plural: 'Bäume',
    frequency: 2,
    examples: ['Der Baum ist hoch.', 'Im Park sind viele Bäume.'],
    tags: ['plant'],
    pronunciation: 'baʊm'
  }),
  createWord('w058', 'Blume', 'feminine', 'flower', 'hoa', 'nature', 'A1', {
    plural: 'Blumen',
    frequency: 2,
    examples: ['Die Blume ist schön.', 'Ich kaufe Blumen.'],
    tips: ['Words ending in -e are often feminine'],
    tags: ['plant'],
    pronunciation: 'ˈbluːmə'
  }),
  createWord('w059', 'Sonne', 'feminine', 'sun', 'mặt trời', 'weather', 'A1', {
    frequency: 1,
    examples: ['Die Sonne scheint.', 'Die Sonne ist warm.'],
    tips: ['Words ending in -e are often feminine'],
    tags: ['sky', 'warm'],
    pronunciation: 'ˈzɔnə'
  }),
  createWord('w060', 'Regen', 'masculine', 'rain', 'mưa', 'weather', 'A1', {
    frequency: 1,
    examples: ['Der Regen fällt.', 'Ich mag den Regen nicht.'],
    tags: ['wet'],
    pronunciation: 'ˈʁeːɡn̩'
  }),
  createWord('w061', 'Schnee', 'masculine', 'snow', 'tuyết', 'weather', 'A1', {
    frequency: 2,
    examples: ['Der Schnee ist weiß.', 'Im Winter gibt es Schnee.'],
    tags: ['cold', 'winter'],
    pronunciation: 'ʃneː'
  }),
  createWord('w062', 'Himmel', 'masculine', 'sky', 'bầu trời', 'nature', 'A2', {
    frequency: 2,
    examples: ['Der Himmel ist blau.', 'Ich schaue in den Himmel.'],
    tags: ['above'],
    pronunciation: 'ˈhɪml̩'
  }),

  // ============ TIME ============
  createWord('w063', 'Tag', 'masculine', 'day', 'ngày', 'time', 'A1', {
    plural: 'Tage',
    frequency: 1,
    examples: ['Der Tag ist schön.', 'Guten Tag!'],
    tags: ['greeting', 'calendar'],
    pronunciation: 'taːk'
  }),
  createWord('w064', 'Nacht', 'feminine', 'night', 'đêm', 'time', 'A1', {
    plural: 'Nächte',
    frequency: 1,
    examples: ['Die Nacht ist dunkel.', 'Gute Nacht!'],
    tags: ['greeting', 'dark'],
    pronunciation: 'naxt'
  }),
  createWord('w065', 'Woche', 'feminine', 'week', 'tuần', 'time', 'A1', {
    plural: 'Wochen',
    frequency: 1,
    examples: ['Die Woche hat 7 Tage.', 'Nächste Woche fahre ich nach Berlin.'],
    tips: ['Words ending in -e are often feminine'],
    tags: ['calendar'],
    pronunciation: 'ˈvɔxə'
  }),
  createWord('w066', 'Monat', 'masculine', 'month', 'tháng', 'time', 'A1', {
    plural: 'Monate',
    frequency: 1,
    examples: ['Der Monat hat 30 Tage.', 'Im nächsten Monat ist mein Geburtstag.'],
    tags: ['calendar'],
    pronunciation: 'ˈmoːnat'
  }),
  createWord('w067', 'Jahr', 'neuter', 'year', 'năm', 'time', 'A1', {
    plural: 'Jahre',
    frequency: 1,
    examples: ['Das Jahr hat 12 Monate.', 'Ich bin 25 Jahre alt.'],
    tags: ['calendar', 'age'],
    pronunciation: 'jaːɐ̯'
  }),
  createWord('w068', 'Stunde', 'feminine', 'hour', 'giờ', 'time', 'A1', {
    plural: 'Stunden',
    frequency: 1,
    examples: ['Eine Stunde hat 60 Minuten.', 'Der Film dauert zwei Stunden.'],
    tips: ['Words ending in -e are often feminine'],
    tags: ['clock'],
    pronunciation: 'ˈʃtʊndə'
  }),
  createWord('w069', 'Minute', 'feminine', 'minute', 'phút', 'time', 'A1', {
    plural: 'Minuten',
    frequency: 1,
    examples: ['Eine Minute hat 60 Sekunden.', 'Warte eine Minute.'],
    tips: ['Words ending in -e are often feminine'],
    tags: ['clock'],
    pronunciation: 'miˈnuːtə'
  }),
  createWord('w070', 'Uhr', 'feminine', 'clock/watch', 'đồng hồ', 'time', 'A1', {
    plural: 'Uhren',
    frequency: 1,
    examples: ['Die Uhr ist alt.', 'Es ist 10 Uhr.'],
    tags: ['device', 'time-telling'],
    pronunciation: 'uːɐ̯'
  }),

  // ============ CLOTHING ============
  createWord('w071', 'Hemd', 'neuter', 'shirt', 'áo sơ mi', 'clothing', 'A1', {
    plural: 'Hemden',
    frequency: 2,
    examples: ['Das Hemd ist weiß.', 'Ich trage ein Hemd.'],
    tags: ['top', 'formal'],
    pronunciation: 'hɛmt'
  }),
  createWord('w072', 'Hose', 'feminine', 'trousers', 'quần', 'clothing', 'A1', {
    plural: 'Hosen',
    frequency: 1,
    examples: ['Die Hose ist blau.', 'Ich kaufe eine neue Hose.'],
    tips: ['Words ending in -e are often feminine'],
    tags: ['bottom'],
    pronunciation: 'ˈhoːzə'
  }),
  createWord('w073', 'Schuh', 'masculine', 'shoe', 'giày', 'clothing', 'A1', {
    plural: 'Schuhe',
    frequency: 1,
    examples: ['Der Schuh ist neu.', 'Ich ziehe meine Schuhe an.'],
    tags: ['feet'],
    pronunciation: 'ʃuː'
  }),
  createWord('w074', 'Jacke', 'feminine', 'jacket', 'áo khoác', 'clothing', 'A1', {
    plural: 'Jacken',
    frequency: 2,
    examples: ['Die Jacke ist warm.', 'Zieh deine Jacke an.'],
    tips: ['Words ending in -e are often feminine'],
    tags: ['top', 'outer'],
    pronunciation: 'ˈjakə'
  }),
  createWord('w075', 'Kleid', 'neuter', 'dress', 'váy', 'clothing', 'A1', {
    plural: 'Kleider',
    frequency: 2,
    examples: ['Das Kleid ist schön.', 'Sie trägt ein rotes Kleid.'],
    tags: ['female', 'formal'],
    pronunciation: 'klaɪt'
  }),

  // ============ GENERAL/COMMON ============
  createWord('w076', 'Mann', 'masculine', 'man', 'đàn ông', 'general', 'A1', {
    plural: 'Männer',
    frequency: 1,
    examples: ['Der Mann ist groß.', 'Der Mann liest eine Zeitung.'],
    tags: ['person', 'male', 'adult'],
    pronunciation: 'man'
  }),
  createWord('w077', 'Frau', 'feminine', 'woman/wife', 'phụ nữ/vợ', 'general', 'A1', {
    plural: 'Frauen',
    frequency: 1,
    examples: ['Die Frau ist nett.', 'Meine Frau kocht gut.'],
    tags: ['person', 'female', 'adult'],
    pronunciation: 'fʁaʊ'
  }),
  createWord('w078', 'Freund', 'masculine', 'friend (male)/boyfriend', 'bạn/bạn trai', 'general', 'A1', {
    plural: 'Freunde',
    frequency: 1,
    examples: ['Mein Freund wohnt in Berlin.', 'Er ist mein bester Freund.'],
    tags: ['person', 'male', 'relationship'],
    pronunciation: 'fʁɔɪnt'
  }),
  createWord('w079', 'Freundin', 'feminine', 'friend (female)/girlfriend', 'bạn gái', 'general', 'A1', {
    plural: 'Freundinnen',
    frequency: 1,
    examples: ['Meine Freundin studiert Medizin.', 'Sie ist meine beste Freundin.'],
    tips: ['Words ending in -in are always feminine (female form)'],
    tags: ['person', 'female', 'relationship'],
    pronunciation: 'ˈfʁɔɪndɪn'
  }),
  createWord('w080', 'Name', 'masculine', 'name', 'tên', 'general', 'A1', {
    plural: 'Namen',
    frequency: 1,
    examples: ['Mein Name ist Hans.', 'Wie ist Ihr Name?'],
    tags: ['identity'],
    pronunciation: 'ˈnaːmə'
  }),
  createWord('w081', 'Geld', 'neuter', 'money', 'tiền', 'general', 'A1', {
    frequency: 1,
    examples: ['Das Geld ist wichtig.', 'Ich habe kein Geld.'],
    tags: ['finance'],
    pronunciation: 'ɡɛlt'
  }),
  createWord('w082', 'Problem', 'neuter', 'problem', 'vấn đề', 'general', 'A1', {
    plural: 'Probleme',
    frequency: 1,
    examples: ['Das ist kein Problem.', 'Ich habe ein Problem.'],
    tags: ['abstract'],
    pronunciation: 'pʁoˈbleːm'
  }),
  createWord('w083', 'Frage', 'feminine', 'question', 'câu hỏi', 'general', 'A1', {
    plural: 'Fragen',
    frequency: 1,
    examples: ['Das ist eine gute Frage.', 'Ich habe eine Frage.'],
    tips: ['Words ending in -e are often feminine'],
    tags: ['communication'],
    pronunciation: 'ˈfʁaːɡə'
  }),
  createWord('w084', 'Antwort', 'feminine', 'answer', 'câu trả lời', 'general', 'A1', {
    plural: 'Antworten',
    frequency: 1,
    examples: ['Die Antwort ist richtig.', 'Ich warte auf eine Antwort.'],
    tags: ['communication'],
    pronunciation: 'ˈantvɔʁt'
  }),
  createWord('w085', 'Sprache', 'feminine', 'language', 'ngôn ngữ', 'general', 'A1', {
    plural: 'Sprachen',
    frequency: 1,
    examples: ['Deutsch ist eine schöne Sprache.', 'Ich lerne viele Sprachen.'],
    tips: ['Words ending in -e are often feminine'],
    tags: ['communication', 'learning'],
    pronunciation: 'ˈʃpʁaːxə'
  }),

  // ============ TECHNOLOGY ============
  createWord('w086', 'Handy', 'neuter', 'mobile phone', 'điện thoại di động', 'technology', 'A1', {
    plural: 'Handys',
    frequency: 1,
    examples: ['Das Handy klingelt.', 'Wo ist mein Handy?'],
    tags: ['device', 'communication'],
    pronunciation: 'ˈhɛndi'
  }),
  createWord('w087', 'Telefon', 'neuter', 'telephone', 'điện thoại', 'technology', 'A1', {
    plural: 'Telefone',
    frequency: 1,
    examples: ['Das Telefon klingelt.', 'Ich benutze selten das Telefon.'],
    tags: ['device', 'communication'],
    pronunciation: 'teleˈfoːn'
  }),
  createWord('w088', 'Internet', 'neuter', 'internet', 'internet', 'technology', 'A1', {
    frequency: 1,
    examples: ['Das Internet ist schnell.', 'Ich suche im Internet.'],
    tags: ['digital', 'communication'],
    pronunciation: 'ˈɪntɐˌnɛt'
  }),
  createWord('w089', 'E-Mail', 'feminine', 'email', 'email', 'technology', 'A1', {
    plural: 'E-Mails',
    frequency: 1,
    examples: ['Die E-Mail ist wichtig.', 'Ich schreibe eine E-Mail.'],
    tags: ['digital', 'communication'],
    pronunciation: 'ˈiːmeɪl'
  }),
  createWord('w090', 'Foto', 'neuter', 'photo', 'ảnh', 'technology', 'A1', {
    plural: 'Fotos',
    frequency: 1,
    examples: ['Das Foto ist schön.', 'Ich mache ein Foto.'],
    tags: ['image', 'memory'],
    pronunciation: 'ˈfoːto'
  }),

  // ============ MORE A2 WORDS ============
  createWord('w091', 'Zeitung', 'feminine', 'newspaper', 'báo', 'general', 'A2', {
    plural: 'Zeitungen',
    frequency: 2,
    examples: ['Die Zeitung ist aktuell.', 'Ich lese die Zeitung.'],
    tips: ['Words ending in -ung are always feminine'],
    tags: ['reading', 'media'],
    pronunciation: 'ˈtsaɪtʊŋ'
  }),
  createWord('w092', 'Musik', 'feminine', 'music', 'âm nhạc', 'music', 'A1', {
    frequency: 1,
    examples: ['Die Musik ist laut.', 'Ich höre gern Musik.'],
    tags: ['art', 'entertainment'],
    pronunciation: 'muˈziːk'
  }),
  createWord('w093', 'Film', 'masculine', 'film/movie', 'phim', 'general', 'A1', {
    plural: 'Filme',
    frequency: 1,
    examples: ['Der Film ist interessant.', 'Wir schauen einen Film.'],
    tags: ['entertainment', 'media'],
    pronunciation: 'fɪlm'
  }),
  createWord('w094', 'Restaurant', 'neuter', 'restaurant', 'nhà hàng', 'food', 'A1', {
    plural: 'Restaurants',
    frequency: 2,
    examples: ['Das Restaurant ist teuer.', 'Wir essen im Restaurant.'],
    tags: ['food', 'place'],
    pronunciation: 'ʁɛstoˈʁɑ̃ː'
  }),
  createWord('w095', 'Hotel', 'neuter', 'hotel', 'khách sạn', 'travel', 'A1', {
    plural: 'Hotels',
    frequency: 2,
    examples: ['Das Hotel ist groß.', 'Ich übernachte im Hotel.'],
    tags: ['accommodation', 'travel'],
    pronunciation: 'hoˈtɛl'
  }),
  createWord('w096', 'Krankenhaus', 'neuter', 'hospital', 'bệnh viện', 'health', 'A2', {
    plural: 'Krankenhäuser',
    frequency: 2,
    examples: ['Das Krankenhaus ist modern.', 'Er liegt im Krankenhaus.'],
    tips: ['Compound word: Kranken (sick) + Haus (house)'],
    tags: ['medical', 'building'],
    pronunciation: 'ˈkʁaŋkn̩ˌhaʊs'
  }),
  createWord('w097', 'Arzt', 'masculine', 'doctor (male)', 'bác sĩ (nam)', 'health', 'A1', {
    plural: 'Ärzte',
    frequency: 1,
    examples: ['Der Arzt untersucht mich.', 'Ich gehe zum Arzt.'],
    tags: ['profession', 'medical', 'male'],
    pronunciation: 'aʁtst'
  }),
  createWord('w098', 'Ärztin', 'feminine', 'doctor (female)', 'bác sĩ (nữ)', 'health', 'A1', {
    plural: 'Ärztinnen',
    frequency: 1,
    examples: ['Die Ärztin ist freundlich.', 'Meine Ärztin ist sehr gut.'],
    tips: ['Words ending in -in are always feminine (female profession)'],
    tags: ['profession', 'medical', 'female'],
    pronunciation: 'ˈɛʁtstɪn'
  }),
  createWord('w099', 'Medizin', 'feminine', 'medicine', 'thuốc', 'health', 'A2', {
    plural: 'Medizinen',
    frequency: 2,
    examples: ['Die Medizin hilft.', 'Ich nehme Medizin.'],
    tags: ['medical', 'treatment'],
    pronunciation: 'mediˈtsiːn'
  }),
  createWord('w100', 'Liebe', 'feminine', 'love', 'tình yêu', 'emotions', 'A2', {
    frequency: 2,
    examples: ['Die Liebe ist wunderbar.', 'Ich glaube an die Liebe.'],
    tips: ['Words ending in -e are often feminine'],
    tags: ['emotion', 'abstract'],
    pronunciation: 'ˈliːbə'
  })
];

/**
 * Get all seed words
 */
export function getSeedWords(): SeedWord[] {
  return SEED_WORDS;
}

/**
 * Get seed words count by gender
 */
export function getSeedWordsByGender(): Record<Gender, number> {
  return SEED_WORDS.reduce((acc, word) => {
    acc[word.gender] = (acc[word.gender] || 0) + 1;
    return acc;
  }, {} as Record<Gender, number>);
}