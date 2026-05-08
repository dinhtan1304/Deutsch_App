'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { useAIVocabQuota, useAIGenerateVocabulary } from '@/hooks/usePersonalWords';
import { AIGeneratedVocabWord } from '@/lib/api/personal-words';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import { IconSparkles, IconX, IconLoader, IconCheck } from '@/components/ui/Icons';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  collectionId?: string;
}

type Step = 'form' | 'generating' | 'preview';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

const WORD_TYPE_LABELS: Record<string, string> = {
  nomen: 'N', verb: 'V', adjektiv: 'Adj', adverb: 'Adv',
  praposition: 'Prä', konjunktion: 'Konj', pronomen: 'Pron',
  partikel: 'Part', andere: '?',
};

const WORD_TYPE_COLORS: Record<string, string> = {
  nomen: ACCENT.vocab,
  verb: ACCENT.reading,
  adjektiv: ACCENT.games,
  adverb: ACCENT.srs,
  praposition: ACCENT.cyan,
  konjunktion: ACCENT.xp,
  pronomen: ACCENT.listening,
  partikel: ACCENT.teal,
  andere: ACCENT.gray,
};

export function AIVocabModal({ isOpen, onClose, collectionId }: Props) {
  const [step, setStep] = useState<Step>('form');
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(10);
  const [level, setLevel] = useState('');
  const [description, setDescription] = useState('');
  const [generatedWords, setGeneratedWords] = useState<AIGeneratedVocabWord[]>([]);
  const [batchBoundaries, setBatchBoundaries] = useState<number[]>([]);
  const [checkedWords, setCheckedWords] = useState<Set<number>>(new Set());
  const [excludeWords, setExcludeWords] = useState<string[]>([]);
  const [resultInfo, setResultInfo] = useState({ wordsAdded: 0, wordsSkipped: 0, quotaRemaining: 0, weeklyLimit: 1 });
  const [error, setError] = useState('');

  const { data: quota } = useAIVocabQuota();
  const generateMutation = useAIGenerateVocabulary();

  if (!isOpen) return null;

  const handleClose = () => {
    setStep('form');
    setTopic('');
    setCount(10);
    setLevel('');
    setDescription('');
    setGeneratedWords([]);
    setBatchBoundaries([]);
    setExcludeWords([]);
    setError('');
    onClose();
  };

  const runGenerate = async (useExclude: boolean) => {
    if (!topic.trim()) return;
    setError('');
    setStep('generating');

    try {
      const result = await generateMutation.mutateAsync({
        topic: topic.trim(),
        count,
        description: description.trim() || undefined,
        level: level || undefined,
        collectionId,
        excludeWords: useExclude && excludeWords.length > 0 ? excludeWords : undefined,
      });

      if (useExclude) {
        const baseLen = generatedWords.length;
        setBatchBoundaries(prev => [...prev, baseLen]);
        setGeneratedWords(prev => [...prev, ...result.words]);
        setCheckedWords(prev => {
          const next = new Set(prev);
          result.words.forEach((_, i) => next.add(baseLen + i));
          return next;
        });
        setResultInfo(prev => ({
          wordsAdded: prev.wordsAdded + result.wordsAdded,
          wordsSkipped: prev.wordsSkipped + result.wordsSkipped,
          quotaRemaining: result.quotaRemaining,
          weeklyLimit: result.weeklyLimit,
        }));
      } else {
        setBatchBoundaries([]);
        setGeneratedWords(result.words);
        setCheckedWords(new Set(result.words.map((_, i) => i)));
        setResultInfo({
          wordsAdded: result.wordsAdded,
          wordsSkipped: result.wordsSkipped,
          quotaRemaining: result.quotaRemaining,
          weeklyLimit: result.weeklyLimit,
        });
      }
      setExcludeWords(prev =>
        [...new Set([...prev, ...result.words.map(w => w.word)])].slice(-50)
      );
      setStep('preview');
    } catch (err: any) {
      setError(err?.message ?? 'Có lỗi xảy ra, vui lòng thử lại.');
      setStep('form');
    }
  };

  const quotaRemaining = step === 'preview' ? resultInfo.quotaRemaining : (quota?.remaining ?? 0);
  const weeklyLimit = step === 'preview' ? resultInfo.weeklyLimit : (quota?.weeklyLimit ?? 1);
  const isPremium = quota?.isPremium ?? false;
  const checkedCount = checkedWords.size;

  const getWordDisplayLabel = (w: AIGeneratedVocabWord) => {
    if (w.wordType === 'nomen' && w.nomenData?.article) return `${w.nomenData.article} ${w.word}`;
    return w.word;
  };

  const quotaColor = quotaRemaining === 0 ? STATUS.danger : quotaRemaining === 1 ? STATUS.warning : STATUS.success;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{ backgroundColor: 'var(--theme-bg-card)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between p-4 border-b"
          style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: GRADIENT.vocab }}>
              <IconSparkles size={17} style={{ color: 'white' }} />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight" style={{ color: 'var(--theme-text-primary)' }}>
                Tạo từ vựng bằng AI
              </h2>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: `${quotaColor}1A`, color: quotaColor }}
              >
                Còn {quotaRemaining}/{weeklyLimit} lượt tuần này
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:opacity-70 shrink-0"
            style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}
          >
            <IconX size={16} />
          </button>
        </div>

        <div className="p-5">

          {/* ══ FORM STEP ══ */}
          {step === 'form' && (
            <>
              {/* Upsell — free user quota exhausted */}
              {quota?.remaining === 0 && !isPremium ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
                    style={{ background: GRADIENT.vocab }}>
                    <IconSparkles size={28} style={{ color: 'white' }} />
                  </div>
                  <h3 className="text-base font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
                    Đã dùng hết lượt tuần này
                  </h3>
                  <p className="text-sm mb-1" style={{ color: 'var(--theme-text-muted)' }}>
                    Tài khoản miễn phí được tạo <strong>1 bộ từ</strong> mỗi tuần.
                  </p>
                  <p className="text-sm mb-6" style={{ color: 'var(--theme-text-muted)' }}>
                    Nâng cấp Premium để tạo <strong>5 bộ từ</strong> mỗi tuần.
                  </p>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-md hover:-translate-y-0.5"
                    style={{ background: GRADIENT.vocab }}
                    onClick={handleClose}
                  >
                    Xem gói Premium
                  </Link>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Topic */}
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--theme-text-primary)' }}>
                      Chủ đề từ vựng <span style={{ color: STATUS.danger }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={topic}
                      onChange={e => setTopic(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && topic.trim() && runGenerate(false)}
                      placeholder="VD: Tiere, Berufe, Im Restaurant, Körperteile..."
                      maxLength={100}
                      className="w-full px-4 py-2.5 rounded-xl text-sm border outline-none transition-all"
                      style={{
                        borderColor: 'var(--theme-border)',
                        backgroundColor: 'var(--theme-bg-secondary)',
                        color: 'var(--theme-text-primary)',
                      }}
                    />
                  </div>

                  {/* Count slider */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                        Số từ vựng
                      </label>
                      <span className="text-sm font-bold px-2 py-0.5 rounded-lg"
                        style={{ backgroundColor: `${ACCENT.vocab}1A`, color: ACCENT.vocab }}>
                        {count} từ
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={50}
                      value={count}
                      onChange={e => setCount(Number(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: ACCENT.vocab }}
                    />
                    <div className="flex justify-between text-[10px] mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                      <span>1</span><span>25</span><span>50</span>
                    </div>
                  </div>

                  {/* Level */}
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--theme-text-primary)' }}>
                      Trình độ <span className="font-normal text-xs" style={{ color: 'var(--theme-text-muted)' }}>(tuỳ chọn)</span>
                    </label>
                    <select
                      value={level}
                      onChange={e => setLevel(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                      style={{
                        borderColor: 'var(--theme-border)',
                        backgroundColor: 'var(--theme-bg-secondary)',
                        color: 'var(--theme-text-primary)',
                      }}
                    >
                      <option value="">Tất cả trình độ</option>
                      {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--theme-text-primary)' }}>
                      Mô tả thêm <span className="font-normal text-xs" style={{ color: 'var(--theme-text-muted)' }}>(tuỳ chọn)</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="VD: Chỉ lấy động từ mạnh, liên quan đến nấu ăn trong nhà bếp..."
                      maxLength={300}
                      rows={2}
                      className="w-full px-4 py-2.5 rounded-xl text-sm border outline-none resize-none"
                      style={{
                        borderColor: 'var(--theme-border)',
                        backgroundColor: 'var(--theme-bg-secondary)',
                        color: 'var(--theme-text-primary)',
                      }}
                    />
                    <div className="text-right text-[10px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                      {description.length}/300
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 rounded-xl" style={{ backgroundColor: `${STATUS.danger}1A`, color: STATUS.danger }}>
                      <p className="text-sm">{error}</p>
                    </div>
                  )}

                  <button
                    onClick={() => runGenerate(false)}
                    disabled={!topic.trim()}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-md hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                    style={{ background: GRADIENT.vocab }}
                  >
                    <IconSparkles size={16} />
                    Tạo {count} từ vựng
                  </button>
                </div>
              )}
            </>
          )}

          {/* ══ GENERATING STEP ══ */}
          {step === 'generating' && (
            <div className="flex flex-col items-center py-12 gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: GRADIENT.vocab }}>
                <IconLoader size={28} style={{ color: 'white' }} />
              </div>
              <div className="text-center">
                <p className="font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>
                  AI đang tạo từ vựng...
                </p>
                <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                  Chủ đề: <strong>{topic}</strong>
                  {level && <span> · {level}</span>}
                </p>
              </div>
            </div>
          )}

          {/* ══ PREVIEW STEP ══ */}
          {step === 'preview' && (
            <div className="space-y-4">
              {/* Result summary */}
              <div className="p-3 rounded-xl border"
                style={{ borderColor: `${ACCENT.vocab}33`, backgroundColor: `${ACCENT.vocab}0D` }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                  AI tạo được{' '}
                  <span style={{ color: ACCENT.vocab }}>{resultInfo.wordsAdded} từ mới</span>
                  {resultInfo.wordsSkipped > 0 && (
                    <span className="font-normal" style={{ color: 'var(--theme-text-muted)' }}>
                      {' '}({resultInfo.wordsSkipped} từ đã có trong sổ)
                    </span>
                  )}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                  Tất cả đã được thêm vào {collectionId ? 'bộ sưu tập' : 'sổ từ vựng'} của bạn
                </p>
              </div>

              {/* Word list */}
              <div className="rounded-xl border overflow-hidden"
                style={{ borderColor: 'var(--theme-border)' }}>
                {generatedWords.map((w, i) => {
                  const typeColor = WORD_TYPE_COLORS[w.wordType] ?? ACCENT.gray;
                  const typeLabel = w.wordType === 'nomen' && w.nomenData?.article
                    ? w.nomenData.article
                    : (WORD_TYPE_LABELS[w.wordType] ?? w.wordType);
                  const batchIdx = batchBoundaries.indexOf(i);
                  return (
                    <Fragment key={i}>
                      {batchIdx >= 0 && (
                        <div
                          className="px-3 py-1.5 text-[10px] font-semibold tracking-wide border-b text-center"
                          style={{
                            borderColor: 'var(--theme-border)',
                            backgroundColor: 'var(--theme-bg-secondary)',
                            color: 'var(--theme-text-muted)',
                          }}
                        >
                          — Lượt {batchIdx + 2} —
                        </div>
                      )}
                    <div
                      className="flex items-center gap-3 px-3 py-2.5 border-b last:border-b-0"
                      style={{ borderColor: 'var(--theme-border)' }}
                    >
                      <input
                        type="checkbox"
                        checked={checkedWords.has(i)}
                        onChange={() => setCheckedWords(prev => {
                          const next = new Set(prev);
                          if (next.has(i)) next.delete(i); else next.add(i);
                          return next;
                        })}
                        className="w-4 h-4 rounded cursor-pointer shrink-0"
                        style={{ accentColor: ACCENT.vocab }}
                      />
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0"
                        style={{ backgroundColor: `${typeColor}1A`, color: typeColor }}
                      >
                        {typeLabel}
                      </span>
                      <div className="flex-1 min-w-0 flex items-baseline gap-1.5 flex-wrap">
                        <span className="font-semibold text-sm" style={{ color: 'var(--theme-text-primary)' }}>
                          {getWordDisplayLabel(w)}
                        </span>
                        {w.wordType === 'nomen' && w.nomenData?.plural && (
                          <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                            · pl. {w.nomenData.plural}
                          </span>
                        )}
                        <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>—</span>
                        <span className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
                          {w.translationVi}
                        </span>
                      </div>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded shrink-0"
                        style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}
                      >
                        {w.level}
                      </span>
                    </div>
                    </Fragment>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => runGenerate(true)}
                  disabled={resultInfo.quotaRemaining === 0 || generateMutation.isPending}
                  title={resultInfo.quotaRemaining === 0 ? 'Đã hết lượt tuần này' : undefined}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  style={{
                    borderColor: ACCENT.vocab,
                    color: ACCENT.vocab,
                    backgroundColor: `${ACCENT.vocab}0D`,
                  }}
                >
                  <IconSparkles size={14} />
                  Tạo thêm
                  {resultInfo.quotaRemaining === 0 && <span className="text-xs">(hết lượt)</span>}
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-md hover:-translate-y-0.5"
                  style={{ background: GRADIENT.vocab }}
                >
                  <IconCheck size={14} />
                  Hoàn tất{checkedCount > 0 ? ` (${checkedCount} từ)` : ''}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
