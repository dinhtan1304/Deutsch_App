'use client';
/* eslint-disable no-restricted-syntax */

import { useState } from 'react';
import { ACCENT, STATUS } from '@/lib/tokens';
import { useRouter } from 'next/navigation';
import { IconBook, IconChevronDown, IconChevronLeft, IconChevronRight } from '@/components/ui/Icons';

// ─── Data ───

const BESTIMMT = {
  headers: ['', 'Maskulin', 'Feminin', 'Neutrum', 'Plural'],
  rows: [
    ['Nominativ', 'der', 'die', 'das', 'die'],
    ['Akkusativ', 'den', 'die', 'das', 'die'],
    ['Dativ', 'dem', 'der', 'dem', 'den'],
    ['Genitiv', 'des', 'der', 'des', 'der'],
  ],
};

const UNBESTIMMT = {
  headers: ['', 'Maskulin', 'Feminin', 'Neutrum', 'Plural'],
  rows: [
    ['Nominativ', 'ein', 'eine', 'ein', '–'],
    ['Akkusativ', 'einen', 'eine', 'ein', '–'],
    ['Dativ', 'einem', 'einer', 'einem', '–'],
    ['Genitiv', 'eines', 'einer', 'eines', '–'],
  ],
};

const PERSONAL_PRONOUNS = {
  headers: ['', 'Nominativ', 'Akkusativ', 'Dativ'],
  rows: [
    ['ich', 'ich', 'mich', 'mir'],
    ['du', 'du', 'dich', 'dir'],
    ['er', 'er', 'ihn', 'ihm'],
    ['sie', 'sie', 'sie', 'ihr'],
    ['es', 'es', 'es', 'ihm'],
    ['wir', 'wir', 'uns', 'uns'],
    ['ihr', 'ihr', 'euch', 'euch'],
    ['sie/Sie', 'sie/Sie', 'sie/Sie', 'ihnen/Ihnen'],
  ],
};

const PREPOSITIONS = [
  {
    case: 'Akkusativ',
    color: ACCENT.srs,
    preps: ['durch', 'für', 'gegen', 'ohne', 'um', 'bis', 'entlang'],
    mnemonic: 'Durch Für Gegen Ohne Um → "DOGFU"',
  },
  {
    case: 'Dativ',
    color: ACCENT.listening,
    preps: ['aus', 'bei', 'mit', 'nach', 'seit', 'von', 'zu', 'gegenüber', 'außer'],
    mnemonic: 'Aus Bei Mit Nach Seit Von Zu → "AB MNSV Z"',
  },
  {
    case: 'Wechselpräpositionen (Akk ↔ Dat)',
    color: ACCENT.xp,
    preps: ['an', 'auf', 'hinter', 'in', 'neben', 'über', 'unter', 'vor', 'zwischen'],
    mnemonic: 'Wohin? → Akkusativ · Wo? → Dativ',
  },
];

const IRREGULAR_VERBS: [string, string, string, string, string][] = [
  // [Infinitiv, Präsens (er), Präteritum, Perfekt, Nghĩa]
  ['sein', 'ist', 'war', 'ist gewesen', 'là, ở'],
  ['haben', 'hat', 'hatte', 'hat gehabt', 'có'],
  ['werden', 'wird', 'wurde', 'ist geworden', 'trở thành'],
  ['können', 'kann', 'konnte', 'hat gekonnt', 'có thể'],
  ['müssen', 'muss', 'musste', 'hat gemusst', 'phải'],
  ['wollen', 'will', 'wollte', 'hat gewollt', 'muốn'],
  ['sollen', 'soll', 'sollte', 'hat gesollt', 'nên'],
  ['dürfen', 'darf', 'durfte', 'hat gedurft', 'được phép'],
  ['mögen', 'mag', 'mochte', 'hat gemocht', 'thích'],
  ['wissen', 'weiß', 'wusste', 'hat gewusst', 'biết'],
  ['gehen', 'geht', 'ging', 'ist gegangen', 'đi'],
  ['kommen', 'kommt', 'kam', 'ist gekommen', 'đến'],
  ['sehen', 'sieht', 'sah', 'hat gesehen', 'thấy'],
  ['geben', 'gibt', 'gab', 'hat gegeben', 'cho'],
  ['nehmen', 'nimmt', 'nahm', 'hat genommen', 'lấy'],
  ['fahren', 'fährt', 'fuhr', 'ist gefahren', 'lái/đi'],
  ['lesen', 'liest', 'las', 'hat gelesen', 'đọc'],
  ['sprechen', 'spricht', 'sprach', 'hat gesprochen', 'nói'],
  ['essen', 'isst', 'aß', 'hat gegessen', 'ăn'],
  ['schlafen', 'schläft', 'schlief', 'hat geschlafen', 'ngủ'],
];

// ─── Reusable Components ───

const GENDER_COLORS: Record<number, string> = { 1: ACCENT.srs, 2: ACCENT.listening, 3: STATUS.success, 4: ACCENT.vocab };

function Section({ title, color, children, defaultOpen = true }: {
  title: string; color: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border overflow-hidden transition-all"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left transition-colors hover:opacity-90"
        style={{ backgroundColor: open ? `${color}08` : 'transparent' }}>
        <h2 className="text-[17px] font-bold" style={{ color }}>{title}</h2>
        {open
          ? <IconChevronDown size={18} style={{ color: 'var(--theme-text-muted)' }} />
          : <IconChevronRight size={18} style={{ color: 'var(--theme-text-muted)' }} />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

function GrammarTable({ headers, rows, genderCols = true }: {
  headers: string[]; rows: string[][]; genderCols?: boolean;
}) {
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-body sm:text-sm" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2.5 text-left font-bold whitespace-nowrap"
                style={{
                  color: i === 0 ? 'var(--theme-text-muted)' : (genderCols ? (GENDER_COLORS[i] || 'var(--theme-text-primary)') : 'var(--theme-text-primary)'),
                  borderBottom: '2px solid var(--theme-border)',
                }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2.5 whitespace-nowrap"
                  style={{
                    color: ci === 0 ? 'var(--theme-text-muted)' : 'var(--theme-text-primary)',
                    fontWeight: ci === 0 ? 600 : 500,
                    borderBottom: ri < rows.length - 1 ? '1px solid var(--theme-border)' : 'none',
                    backgroundColor: ri % 2 === 1 ? 'var(--theme-bg-secondary)' : 'transparent',
                    borderRadius: ri % 2 === 1 ? (ci === 0 ? '8px 0 0 8px' : ci === row.length - 1 ? '0 8px 8px 0' : '0') : '0',
                  }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page ───

export default function GrammarCheatsheetPage() {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)' }}>
            <IconBook size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              Cheatsheet Ngữ pháp
            </h1>
            <p className="text-body" style={{ color: 'var(--theme-text-muted)' }}>
              Bảng tóm tắt nhanh các quy tắc ngữ pháp quan trọng
            </p>
          </div>
        </div>
        <button onClick={() => router.push('/grammar')}
          className="flex items-center gap-1 px-4 py-2 rounded-xl text-body font-semibold transition-all hover:-translate-y-0.5"
          style={{
            backgroundColor: 'var(--theme-bg-secondary)',
            color: 'var(--theme-text-secondary)',
            border: '1px solid var(--theme-border)',
          }}>
          <IconChevronLeft size={14} /> Bài học
        </button>
      </div>

      {/* Sections */}
      <div className="space-y-4">

        {/* 1. Bestimmter Artikel */}
        <Section title="Mạo từ xác định (der / die / das)" color="#3B82F6">
          <GrammarTable headers={BESTIMMT.headers} rows={BESTIMMT.rows} />
          <p className="text-xs mt-3" style={{ color: 'var(--theme-text-muted)' }}>
            Mẹo: Chỉ Maskulin Akkusativ thay đổi (der → den). Dativ luôn có -m (dem) trừ Feminin -r (der) và Plural -n (den).
          </p>
        </Section>

        {/* 2. Unbestimmter Artikel */}
        <Section title="Mạo từ bất định (ein / eine)" color="#EC4899">
          <GrammarTable headers={UNBESTIMMT.headers} rows={UNBESTIMMT.rows} />
          <p className="text-xs mt-3" style={{ color: 'var(--theme-text-muted)' }}>
            Lưu ý: Mạo từ bất định không có dạng Plural. Dùng &quot;keine&quot; cho phủ định Plural.
          </p>
        </Section>

        {/* 3. Đại từ nhân xưng */}
        <Section title="Đại từ nhân xưng (Personalpronomen)" color="#22C55E">
          <GrammarTable headers={PERSONAL_PRONOUNS.headers} rows={PERSONAL_PRONOUNS.rows} genderCols={false} />
        </Section>

        {/* 4. Giới từ + Case */}
        <Section title="Giới từ theo Case (Präpositionen)" color="#F59E0B">
          <div className="space-y-4">
            {PREPOSITIONS.map(group => (
              <div key={group.case}>
                <h3 className="text-sm font-bold mb-2" style={{ color: group.color }}>
                  {group.case}
                </h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  {group.preps.map(p => (
                    <span key={p} className="px-3 py-1.5 rounded-lg text-body font-semibold"
                      style={{
                        backgroundColor: `${group.color}12`,
                        color: group.color,
                        border: `1px solid ${group.color}25`,
                      }}>
                      {p}
                    </span>
                  ))}
                </div>
                <p className="text-xs italic" style={{ color: 'var(--theme-text-muted)' }}>
                  {group.mnemonic}
                </p>
              </div>
            ))}
          </div>
        </Section>

        {/* 5. Irregular Verbs */}
        <Section title="20 động từ bất quy tắc phổ biến" color="#8B5CF6" defaultOpen={false}>
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-body sm:text-sm" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  {['Infinitiv', 'Präsens (er/sie/es)', 'Präteritum', 'Perfekt', 'Nghĩa'].map((h, i) => (
                    <th key={i} className="px-3 py-2.5 text-left font-bold whitespace-nowrap"
                      style={{
                        color: i === 0 ? ACCENT.vocab : 'var(--theme-text-muted)',
                        borderBottom: '2px solid var(--theme-border)',
                        fontSize: '12px',
                      }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {IRREGULAR_VERBS.map(([inf, pres, pret, perf, vi], ri) => (
                  <tr key={inf}>
                    <td className="px-3 py-2 font-bold whitespace-nowrap"
                      style={{
                        color: ACCENT.vocab,
                        borderBottom: ri < IRREGULAR_VERBS.length - 1 ? '1px solid var(--theme-border)' : 'none',
                        backgroundColor: ri % 2 === 1 ? 'var(--theme-bg-secondary)' : 'transparent',
                        borderRadius: ri % 2 === 1 ? '8px 0 0 8px' : '0',
                      }}>
                      {inf}
                    </td>
                    {[pres, pret, perf].map((cell, ci) => (
                      <td key={ci} className="px-3 py-2 whitespace-nowrap"
                        style={{
                          color: 'var(--theme-text-primary)',
                          fontWeight: 500,
                          borderBottom: ri < IRREGULAR_VERBS.length - 1 ? '1px solid var(--theme-border)' : 'none',
                          backgroundColor: ri % 2 === 1 ? 'var(--theme-bg-secondary)' : 'transparent',
                        }}>
                        {cell}
                      </td>
                    ))}
                    <td className="px-3 py-2 whitespace-nowrap"
                      style={{
                        color: 'var(--theme-text-muted)',
                        fontStyle: 'italic',
                        borderBottom: ri < IRREGULAR_VERBS.length - 1 ? '1px solid var(--theme-border)' : 'none',
                        backgroundColor: ri % 2 === 1 ? 'var(--theme-bg-secondary)' : 'transparent',
                        borderRadius: ri % 2 === 1 ? '0 8px 8px 0' : '0',
                      }}>
                      {vi}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

      </div>

      {/* Footer nav */}
      <div className="mt-8 text-center">
        <button onClick={() => router.push('/grammar')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
          style={{
            background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
            color: 'white',
            boxShadow: '0 4px 14px rgba(139,92,246,.25)',
          }}>
          <IconChevronLeft size={16} /> Quay lại bài học
        </button>
      </div>
    </div>
  );
}
