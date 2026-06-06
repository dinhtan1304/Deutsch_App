/**
 * Lý thuyết cố định (trình bày): bảng biến cách + quy tắc chia thì + mẹo thực chiến.
 * Style theo mục "cấu trúc đề" (huong-dan-b1): card .word-card-v2 border màu + hover,
 * icon thư viện. Dùng ở tab "Lý thuyết" của hub /grammar/trainer.
 */
/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { ACCENT, RADIUS } from '@/lib/tokens';
import {
  IconLayers, IconList, IconLink, IconTarget, IconClock, IconRefresh, IconLightbulb, IconChevronDown,
} from '@/components/ui/Icons';

type IconCmp = React.ComponentType<{ size?: number; className?: string }>;

const tint = (c: string, pct: number) => `color-mix(in srgb, ${c} ${pct}%, transparent)`;

const CASES = ['Nominativ', 'Akkusativ', 'Dativ', 'Genitiv'] as const;

const DEFINITE: Record<string, [string, string, string, string]> = {
  Nominativ: ['der', 'die', 'das', 'die'],
  Akkusativ: ['den', 'die', 'das', 'die'],
  Dativ: ['dem', 'der', 'dem', 'den'],
  Genitiv: ['des', 'der', 'des', 'der'],
};
const EIN: Record<string, [string, string, string, string]> = {
  Nominativ: ['ein', 'eine', 'ein', '—'],
  Akkusativ: ['einen', 'eine', 'ein', '—'],
  Dativ: ['einem', 'einer', 'einem', '—'],
  Genitiv: ['eines', 'einer', 'eines', '—'],
};
const ADJ_WEAK: Record<string, [string, string, string, string]> = {
  Nominativ: ['-e', '-e', '-e', '-en'],
  Akkusativ: ['-en', '-e', '-e', '-en'],
  Dativ: ['-en', '-en', '-en', '-en'],
  Genitiv: ['-en', '-en', '-en', '-en'],
};
const ADJ_MIXED: Record<string, [string, string, string, string]> = {
  Nominativ: ['-er', '-e', '-es', '-en'],
  Akkusativ: ['-en', '-e', '-es', '-en'],
  Dativ: ['-en', '-en', '-en', '-en'],
  Genitiv: ['-en', '-en', '-en', '-en'],
};

const COL_ACCENT = [ACCENT.der, ACCENT.die, ACCENT.das, ACCENT.gray];
const COL_HEAD = ['der (m)', 'die (f)', 'das (n)', 'die (pl)'];

const KASUS = ACCENT.examWriting; // violet — nhóm Kasus
const TENSE = ACCENT.srs;         // blue — nhóm thì

// ── Presentational helpers (word-card-v2 border màu + hover + icon thư viện) ──

function SectionCard({ title, color, icon: Icon, defaultOpen, children }: { title: string; color: string; icon: IconCmp; defaultOpen?: boolean; children: React.ReactNode }) {
  return (
    <details
      open={defaultOpen}
      className="word-card-v2 group rounded-2xl overflow-hidden"
      style={{
        background: 'var(--theme-bg-card)',
        border: `1px solid color-mix(in srgb, ${color} 42%, var(--theme-border))`,
        ['--card-accent' as string]: color,
      } as React.CSSProperties}
    >
      <summary className="flex items-center gap-3 p-4 cursor-pointer list-none">
        <span className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: tint(color, 16), color }}>
          <Icon size={20} />
        </span>
        <h3 className="text-lead font-bold flex-1 min-w-0" style={{ color: 'var(--theme-text-primary)' }}>{title}</h3>
        <IconChevronDown size={18} className="transition-transform group-open:rotate-180 shrink-0" style={{ color: 'var(--theme-text-muted)' }} />
      </summary>
      <div className="px-4 pb-4">{children}</div>
    </details>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="word-card-v2 flex items-start gap-2 p-3 mb-2.5 last:mb-0 rounded-xl"
      style={{
        background: tint(ACCENT.xp, 9),
        border: `1px solid color-mix(in srgb, ${ACCENT.xp} 30%, var(--theme-border))`,
        ['--card-accent' as string]: ACCENT.xp,
      } as React.CSSProperties}
    >
      <span className="shrink-0" style={{ color: ACCENT.xp, marginTop: 1 }}><IconLightbulb size={16} /></span>
      <div className="text-body" style={{ color: 'var(--theme-text-secondary)', lineHeight: 1.65 }}>{children}</div>
    </div>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="text-sm font-semibold mb-2 mt-1" style={{ color: 'var(--theme-text-primary)' }}>{children}</h4>;
}

function Decl({ title, rows }: { title: string; rows: Record<string, [string, string, string, string]> }) {
  return (
    <div className="mb-4">
      <SubTitle>{title}</SubTitle>
      <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--theme-border)' }}>
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--theme-bg-secondary)' }}>
              <th className="text-left text-caption font-bold px-3 py-2" style={{ color: 'var(--theme-text-muted)' }}>Fall</th>
              {COL_HEAD.map((h, i) => (
                <th key={h} className="text-left text-caption font-bold px-3 py-2" style={{ color: COL_ACCENT[i] }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CASES.map((c) => (
              <tr key={c} style={{ borderTop: '1px solid var(--theme-border)' }}>
                <td className="px-3 py-1.5 font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>{c}</td>
                {(rows[c] ?? []).map((v, i) => (
                  <td key={i} className="px-3 py-1.5 mono" style={{ color: 'var(--theme-text-primary)' }}>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MiniTable({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl mb-3" style={{ border: '1px solid var(--theme-border)' }}>
      <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--theme-bg-secondary)' }}>
            {head.map((h) => (
              <th key={h} className="text-left text-caption font-bold px-3 py-2" style={{ color: 'var(--theme-text-muted)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} style={{ borderTop: '1px solid var(--theme-border)' }}>
              {r.map((cell, ci) => (
                <td key={ci} className="px-3 py-1.5" style={{ color: ci === 0 ? 'var(--theme-text-primary)' : 'var(--theme-text-secondary)', fontWeight: ci === 0 ? 600 : 400, lineHeight: 1.5 }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Pills({ label, items, color }: { label: string; items: string[]; color: string }) {
  return (
    <div className="mb-3.5 last:mb-0">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
        <span className="text-caption font-bold" style={{ color }}>{label}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((p) => (
          <span
            key={p}
            className="word-card-v2 px-3 py-1.5 text-sm font-medium cursor-default"
            style={{
              color,
              background: tint(color, 10),
              border: `1px solid color-mix(in srgb, ${color} 30%, var(--theme-border))`,
              borderRadius: RADIUS.sm,
              ['--card-accent' as string]: color,
            } as React.CSSProperties}
          >
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}

export function TrainerTheory() {
  return (
    <div className="space-y-4">
      {/* ══════════ KASUS ══════════ */}
      <SectionCard title="Các cách (Kasus) — tổng quan" color={KASUS} icon={IconLayers} defaultOpen>
        <MiniTable
          head={['Cách', 'Vai trò', 'Câu hỏi']}
          rows={[
            ['Nominativ', 'Chủ ngữ (ai/cái gì làm hành động)', 'Wer? Was?'],
            ['Akkusativ', 'Tân ngữ trực tiếp (bị tác động)', 'Wen? Was?'],
            ['Dativ', 'Tân ngữ gián tiếp (người nhận)', 'Wem?'],
            ['Genitiv', 'Sở hữu (của ai)', 'Wessen?'],
          ]}
        />
        <Tip><b>Mẹo xác định cách nhanh:</b> tìm động từ/giới từ trước. Ví dụ <i>geben</i> (cho) cần Dativ (người nhận) + Akkusativ (vật cho): „Ich gebe <b>dem Kind</b> (Dativ) <b>einen Apfel</b> (Akk)."</Tip>
      </SectionCard>

      <SectionCard title="Bảng biến cách" color={KASUS} icon={IconList}>
        <Decl title="Mạo từ xác định (der/die/das)" rows={DEFINITE} />
        <Decl title="Mạo từ không xác định (ein) — số nhiều không có" rows={EIN} />
        <Decl title="Đuôi tính từ — sau mạo từ xác định (yếu)" rows={ADJ_WEAK} />
        <Decl title="Đuôi tính từ — sau ein/kein/sở hữu (hỗn hợp)" rows={ADJ_MIXED} />
        <Tip><b>Chỉ giống đực đổi ở Akkusativ:</b> der→den, ein→einen. Còn giống cái/trung/số nhiều ở Nom = Akk (không đổi). Nhớ điều này là xong 50% bài Akkusativ.</Tip>
        <Tip><b>Genitiv & Dativ số nhiều:</b> Genitiv giống đực/trung thêm <b>-(e)s</b> vào danh từ (des Mann<b>es</b>, des Kind<b>es</b>). Dativ số nhiều thêm <b>-n</b> (mit den Kinder<b>n</b>). kein-/sở hữu (mein, dein…) chia đuôi y hệt ein.</Tip>
      </SectionCard>

      <SectionCard title="Giới từ đi với cách (cực quan trọng)" color={KASUS} icon={IconLink}>
        <Pills label="Luôn Akkusativ — nhớ 'DOGFUB'" items={['durch', 'ohne', 'gegen', 'für', 'um', 'bis', 'entlang']} color={ACCENT.die} />
        <Pills label="Luôn Dativ — nhớ 'aus-bei-mit-nach-seit-von-zu'" items={['aus', 'bei', 'mit', 'nach', 'seit', 'von', 'zu', 'gegenüber']} color={ACCENT.der} />
        <Pills label="Giới từ Genitiv" items={['während', 'wegen', 'trotz', 'statt', 'außerhalb', 'innerhalb']} color={ACCENT.gray} />
        <Pills label="Wechselpräpositionen (Akk HOẶC Dativ)" items={['an', 'auf', 'hinter', 'in', 'neben', 'über', 'unter', 'vor', 'zwischen']} color={ACCENT.das} />
        <Tip><b>Wechselpräposition — quy tắc vàng:</b> <b>Wohin?</b> (có chuyển động, đi đâu) → <b>Akkusativ</b>. <b>Wo?</b> (vị trí tĩnh, ở đâu) → <b>Dativ</b>.<br />„Ich gehe in <b>die Schule</b>" (Akk – đang đi tới) ↔ „Ich bin in <b>der Schule</b>" (Dativ – đang ở đó).</Tip>
      </SectionCard>

      <SectionCard title="Động từ luôn đi với Dativ" color={KASUS} icon={IconTarget}>
        <Pills label="Học thuộc nhóm này (không có Akkusativ)" items={['helfen', 'danken', 'gefallen', 'gehören', 'antworten', 'folgen', 'passen', 'schmecken', 'gratulieren']} color={ACCENT.der} />
        <Tip>„Ich danke <b>dir</b>", „Das gefällt <b>mir</b>", „Das Buch gehört <b>dem Lehrer</b>". Nếu phân vân, thử dịch „cho/với ai" → thường là Dativ.</Tip>
      </SectionCard>

      {/* ══════════ THÌ ══════════ */}
      <SectionCard title="Các thì — tổng quan & dấu hiệu nhận biết" color={TENSE} icon={IconClock} defaultOpen>
        <MiniTable
          head={['Thì', 'Dùng khi', 'Dấu hiệu (Signalwort)', 'Ví dụ']}
          rows={[
            ['Präsens', 'Hiện tại / tương lai gần', 'jeden Tag, immer, normalerweise', 'Ich lerne Deutsch.'],
            ['Präteritum', 'Quá khứ — văn viết, kể chuyện', 'gestern, damals, früher', 'Ich lernte Deutsch.'],
            ['Perfekt', 'Quá khứ — hội thoại, nói', 'gestern, schon, letzte Woche', 'Ich habe Deutsch gelernt.'],
            ['Futur I', 'Tương lai, dự định, lời hứa', 'morgen, bald, nächstes Jahr', 'Ich werde Deutsch lernen.'],
          ]}
        />
        <Tip><b>Perfekt hay Präteritum?</b> Khi <b>nói</b> dùng Perfekt; khi <b>viết</b> (báo, truyện) dùng Präteritum. NHƯNG <i>sein, haben</i> và động từ khuyết thiếu (können, müssen…) thường dùng Präteritum cả khi nói: „Ich <b>war</b> müde", „Ich <b>hatte</b> Zeit", „Ich <b>konnte</b> nicht".</Tip>
      </SectionCard>

      <SectionCard title="Cách chia & quy tắc" color={TENSE} icon={IconRefresh}>
        <MiniTable
          head={['Thì', 'Công thức']}
          rows={[
            ['Präsens', 'Thân + đuôi: ich -e, du -st, er/sie/es -t, wir -en, ihr -t, sie/Sie -en'],
            ['Präteritum (yếu)', 'Thân + -te + đuôi: machen → machte, machtest…'],
            ['Präteritum (mạnh)', 'Đổi nguyên âm thân: gehen→ging, finden→fand, fahren→fuhr'],
            ['Perfekt', 'haben/sein (chia ở Präsens) + Partizip II ở cuối câu'],
            ['Futur I', 'werden (chia ở Präsens) + Infinitiv ở cuối câu'],
          ]}
        />
        <Tip><b>Partizip II — quy tắc tạo:</b><br />• Động từ yếu: <b>ge-…-t</b> (spielen → ge<b>spiel</b>t). Mạnh: <b>ge-…-en</b> (gehen → ge<b>gang</b>en).<br />• Động từ đuôi <b>-ieren</b> KHÔNG có ge- (studieren → <b>studiert</b>, telefonieren → telefoniert).<br />• Tách (trennbar): prefix + ge: aufstehen → <b>aufge</b>standen.<br />• Không tách (be-, ver-, er-, ent-, ge-, zer-): KHÔNG ge-: verstehen → <b>verstanden</b>, bekommen → bekommen.</Tip>
        <Tip><b>Perfekt với „sein" — nhớ 3 nhóm:</b> (1) chuyển động có đích: gehen, fahren, kommen, fliegen; (2) thay đổi trạng thái: aufwachen, einschlafen, sterben, werden; (3) đặc biệt: sein, bleiben. Còn lại đa số dùng <b>haben</b>. „Ich <b>bin</b> nach Berlin gefahren" ↔ „Ich <b>habe</b> ein Auto gefahren" (có tân ngữ → haben).</Tip>
        <Tip><b>Futur thường thay bằng Präsens + từ chỉ thời gian:</b> người Đức hay nói „Morgen <b>gehe</b> ich…" thay vì „werde gehen". Futur I dùng nhiều cho <b>dự đoán / lời hứa</b>: „Es <b>wird</b> regnen", „Ich <b>werde</b> dir helfen".</Tip>
      </SectionCard>
    </div>
  );
}
