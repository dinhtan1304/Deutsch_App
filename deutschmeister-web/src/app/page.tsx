'use client';

import { useState, useEffect } from 'react';
import { ACCENT, STATUS } from '@/lib/tokens';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';
import {
  IconZap, IconTarget, IconLayers, IconPenTool,
  IconClock, IconLink, IconHeadphones, IconSpellCheck,
} from '@/components/ui/Icons';
import { LandingDemoQuiz } from './_landing/LandingDemoQuiz';
import { LandingFooter } from './_landing/LandingFooter';
import { LandingStory } from './_landing/LandingStory';
import { LandingFaq } from './_landing/LandingFaq';
import { LandingFinalCta } from './_landing/LandingFinalCta';
import { hexToRgb, DEMO_API_URL, DEMO_STATS } from './_landing/utils';

// ─── Inline Icons ─────────────────────────────────────────────────────────────
const IconBook = () => <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
const IconPen = () => <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;
const IconMic = () => <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>;
const IconBrain = () => <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24A2.5 2.5 0 0 0 14.5 2Z"/></svg>;
const IconGamepad = () => <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="2"/></svg>;
const IconCheck = () => <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconArrow = () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
const IconSparkles = () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>;
const IconGraduate = () => <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
const IconMenu = () => <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
const IconX = () => <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

// ─── Data ─────────────────────────────────────────────────────────────────────
const CORE_FEATURES = [
  {
    icon: IconBook, title: 'Từ điển & Chủ đề', badge: '12+ chủ đề',
    desc: '5000+ từ vựng theo chuẩn Goethe. Học theo chủ đề: gia đình, công việc, du lịch, nhà ở...',
    gradient: 'linear-gradient(135deg, #22C55E, #14B8A6)',
    bg: 'rgba(34,197,94,.07)',
    points: ['5000+ từ vựng chuẩn Goethe', '12+ chủ đề ', 'Ngữ pháp giải thích song ngữ'],
  },
  {
    icon: IconGamepad, title: '8 Trò chơi học từ', badge: 'Gamification',
    desc: 'Học từ vựng không nhàm chán với 8 mini-game đa dạng: quiz, flashcard, điền từ, ghép từ...',
    gradient: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
    bg: 'rgba(139,92,246,.07)',
    points: ['Quick Quiz — trắc nghiệm nhanh', 'Gender Quiz — Der/Die/Das', 'Timed Challenge — thử thách tốc độ'],
  },
  {
    icon: IconBrain, title: 'Ôn tập SRS', badge: 'Spaced Repetition',
    desc: 'Hệ thống ôn tập thông minh dựa trên Spaced Repetition — ghi nhớ từ vĩnh viễn, không quên.',
    gradient: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
    bg: 'rgba(59,130,246,.07)',
    points: ['Thuật toán SRS tối ưu hóa việc ôn', 'Nhắc nhở hàng ngày đúng lúc', 'Theo dõi tiến độ từng từ'],
  },
  {
    icon: IconGraduate, title: 'Luyện thi chuẩn', badge: 'Goethe & TELC',
    desc: 'AI sinh đề từ kho đề thi thật (RAG) — đúng format, đúng độ khó, đúng Teile như kỳ thi Goethe & TELC chính thức.',
    gradient: 'linear-gradient(135deg, #F59E0B, #EF4444)',
    bg: 'rgba(245,158,11,.07)',
    points: ['RAG từ đề thi Goethe/TELC thật', 'A1 · A2 · B1 đầy đủ 4 kỹ năng', 'AI chấm điểm theo tiêu chí chính thức'],
  },
];

const AI_FEATURES = [
  { skill: 'Nghe', icon: IconHeadphones, color: ACCENT.listening, title: 'AI tạo bài nghe tiếng Đức', desc: 'Gemini tạo ra audio tiếng Đức tự nhiên theo cấp độ của bạn. Nghe và trả lời câu hỏi hiểu bài.', badge: 'Tự do + Đề chuẩn Goethe/TELC + Audio chất lượng cao' },
  { skill: 'Viết', icon: IconPen, color: ACCENT.writing, title: 'AI chấm bài viết chi tiết', desc: 'Nộp bài viết tiếng Đức — Gemini phân tích ngữ pháp, từ vựng, cấu trúc câu và cho điểm theo tiêu chí chính thức.', badge: 'Tự do + Đề chuẩn Goethe/TELC + Nhận xét song ngữ Đức-Việt' },
  { skill: 'Nói', icon: IconMic, color: ACCENT.xp, title: 'AI chấm phát âm & ngữ pháp', desc: 'Ghi âm câu trả lời bằng tiếng Đức — Gemini phân tích multimodal từ audio + transcript, chấm 4 tiêu chí.', badge: 'Tự do + Đề chuẩn Goethe/TELC + Phát âm · Ngữ pháp · Từ vựng · Nội dung' },
  { skill: 'Đọc', icon: IconBook, color: STATUS.success, title: 'AI sinh đề từ đề thi thật (RAG)', desc: 'AI học từ kho đề thi Goethe/TELC thật, sinh ra đề mới giống hệt format — cùng độ khó, cùng dạng câu hỏi.', badge: 'RAG từ đề thi thật + Tự do + Đề chuẩn Goethe/TELC' },
];

const EXAM_LEVELS = [
  { level: 'A1', time: 70,  teile: 4, desc: 'Beginner — Giao tiếp cơ bản, giới thiệu bản thân, mua sắm' },
  { level: 'A2', time: 90,  teile: 4, desc: 'Elementary — Cuộc sống hàng ngày, công việc, gia đình' },
  { level: 'B1', time: 120, teile: 4, desc: 'Intermediate — Suy nghĩ, quan điểm, sự kiện xã hội' },
];

const GAMES = [
  { name: 'Quick Quiz',      vi: 'Trắc nghiệm', icon: IconZap,        color: ACCENT.xp },
  { name: 'Gender Quiz',     vi: 'Der/Die/Das',  icon: IconTarget,     color: STATUS.danger },
  { name: 'Flashcards',      vi: 'Thẻ ghi nhớ',  icon: IconLayers,     color: ACCENT.writing },
  { name: 'Fill Blank',      vi: 'Điền từ',       icon: IconPenTool,    color: STATUS.success },
  { name: 'Timed Challenge', vi: 'Thử thách',     icon: IconClock,      color: ACCENT.listening },
  { name: 'Word Match',      vi: 'Ghép từ',       icon: IconLink,       color: ACCENT.teal },
  { name: 'Listening',       vi: 'Nghe từ',       icon: IconHeadphones, color: ACCENT.vocab },
  { name: 'Spelling Bee',    vi: 'Chính tả',      icon: IconSpellCheck, color: ACCENT.games },
];

const STATIC_STATS = [
  { num: '8',  label: 'Trò chơi', sub: 'gamification học từ' },
  { num: '4',  label: 'Kỹ năng',  sub: 'Nghe · Nói · Đọc · Viết' },
];


export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [publicStats, setPublicStats] = useState(DEMO_STATS);

  useEffect(() => {
    fetch(`${DEMO_API_URL}/dashboard/public-stats`)
      .then(r => r.json())
      .then(d => { if (d?.totalUsers) setPublicStats(d); })
      .catch(() => {});
  }, []);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [_hasHydrated, isAuthenticated, router]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Public landing should render immediately; authenticated users redirect once
  // the background session bootstrap finishes.
  if (_hasHydrated && isAuthenticated) {
    return <div style={{ background: '#0a0f1e', minHeight: '100vh' }} />;
  }

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: '#0a0f1e', color: '#f9fafb', overflowX: 'hidden' }}>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Deutschmeister',
          url: 'https://www.deutschmeister.vn',
          description: 'Nền tảng học tiếng Đức toàn diện dành cho người Việt. 5000+ từ vựng, 8 trò chơi, AI chấm 4 kỹ năng, đề thi chuẩn Goethe/TELC A1-B1.',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Web',
          inLanguage: ['vi', 'de'],
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'VND' },
          author: { '@type': 'Organization', name: 'Deutschmeister' },
        }) }}
      />
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .fade-up   { animation: fadeUp .7s ease forwards; }
        .fade-up-1 { animation: fadeUp .7s .1s ease both; }
        .fade-up-2 { animation: fadeUp .7s .2s ease both; }
        .fade-up-3 { animation: fadeUp .7s .3s ease both; }
        .fade-up-4 { animation: fadeUp .7s .4s ease both; }
        .float   { animation: float 4s ease-in-out infinite; }
        .float-2 { animation: float 5s 1s ease-in-out infinite; }
        .card-hover { transition: transform .25s, box-shadow .25s; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,.3); }
        .btn-glow { transition: box-shadow .2s, transform .2s; }
        .btn-glow:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(99,102,241,.5); }
        .btn-outline-hover { transition: background .2s, transform .2s; }
        .btn-outline-hover:hover { background: rgba(255,255,255,.08); transform: translateY(-2px); }
        .gradient-text { background: linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6); background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .gradient-text-amber { background: linear-gradient(135deg, #fbbf24, #f87171); background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .shimmer-badge { background: linear-gradient(90deg, rgba(99,102,241,.3) 0%, rgba(167,139,250,.6) 50%, rgba(99,102,241,.3) 100%); background-size: 200% 100%; animation: shimmer 2.5s linear infinite; }
        .glow-border { border: 1px solid rgba(99,102,241,.3); box-shadow: 0 0 20px rgba(99,102,241,.1), inset 0 0 20px rgba(99,102,241,.03); }
        .glow-border-amber { border: 1px solid rgba(245,158,11,.3); box-shadow: 0 0 20px rgba(245,158,11,.1); }
        @media (max-width: 768px) {
          .hero-title { font-size: 2.5rem !important; }
          .hero-sub { font-size: 14px !important; }
          .section-title { font-size: 1.75rem !important; }
          .hide-mobile { display: none !important; }
          .mobile-menu { display: flex !important; }
          .grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      {/* ─── Navbar ─────────────────────────────────────────────────────────── */}
      <header>
      <nav role="navigation" aria-label="Main navigation" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(10,15,30,.9)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,.06)' : 'none',
        transition: 'all .3s', padding: '0 max(24px, calc(50vw - 600px))',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <Image src="/logo-48.png" width={36} height={36} alt="Deutschmeister" priority style={{ borderRadius: 10 }} />
            <span style={{ fontWeight: 800, fontSize: 17, color: 'white', letterSpacing: '-0.3px' }}>Deutschmeister</span>
          </div>
          <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 32, marginRight: 32 }}>
            {[['Tính năng', '#features'], ['AI', '#ai'], ['Luyện thi', '#exam'], ['Câu chuyện', '#story'], ['Bảng giá', '/pricing']].map(([label, href]) => (
              <a key={href} href={href} style={{ color: 'rgba(255,255,255,.65)', fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'color .2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,.65)')}>
                {label}
              </a>
            ))}
          </div>
          <div className="hide-mobile" style={{ display: 'flex', gap: 10 }}>
            <Link href="/auth/login" className="btn-outline-hover" style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid rgba(255,255,255,.2)', color: 'white', fontSize: 13.5, fontWeight: 600, textDecoration: 'none' }}>Đăng nhập</Link>
            <Link href="/words" className="btn-glow" style={{ padding: '8px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: 'white', fontSize: 13.5, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 14px rgba(99,102,241,.4)' }}>Bắt đầu ngay</Link>
          </div>
          <button onClick={() => setMenuOpen(v => !v)} className="mobile-menu" aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'} aria-expanded={menuOpen} style={{ display: 'none', background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 4 }}>
            {menuOpen ? <IconX /> : <IconMenu />}
          </button>
        </div>
        {menuOpen && (
          <div style={{ background: 'rgba(10,15,30,.98)', padding: '16px 24px 24px', borderTop: '1px solid rgba(255,255,255,.06)' }}>
            {[['Tính năng', '#features'], ['AI', '#ai'], ['Luyện thi', '#exam'], ['Câu chuyện', '#story'], ['Bảng giá', '/pricing']].map(([label, href]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '12px 0', color: 'rgba(255,255,255,.8)', fontSize: 15, fontWeight: 500, textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,.06)' }}>{label}</a>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <Link href="/auth/login" style={{ flex: 1, padding: '10px', textAlign: 'center', border: '1px solid rgba(255,255,255,.2)', borderRadius: 10, color: 'white', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Đăng nhập</Link>
              <Link href="/words" style={{ flex: 1, padding: '10px', textAlign: 'center', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', borderRadius: 10, color: 'white', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Bắt đầu miễn phí</Link>
            </div>
          </div>
        )}
      </nav>
      </header>

      <main>
      {/* ─── Hero ───────────────────────────────────────────────────────────── */}
      <section style={{ minHeight: '92vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '116px 24px 56px', position: 'relative', overflow: 'hidden' }}>
        <div className="fade-up shimmer-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 100, marginBottom: 24, fontSize: 13, fontWeight: 600 }}>
          <IconSparkles /><span>Chuẩn Goethe/TELC</span>
        </div>

        <h1 className="fade-up-1 hero-title" style={{ fontSize: '4rem', fontWeight: 900, lineHeight: 1.1, textAlign: 'center', maxWidth: 800, margin: '0 0 20px', letterSpacing: '-1.5px' }}>
          Học tiếng Đức <span className="gradient-text">thông minh</span><br />cùng AI
        </h1>

        <p className="fade-up-2 hero-sub" style={{ fontSize: 16, color: 'rgba(255,255,255,.55)', textAlign: 'center', maxWidth: 640, lineHeight: 1.75, marginBottom: 40 }}>
          Nền tảng luyện thi tiếng Đức toàn diện — từ từ vựng cơ bản đến đề thi Goethe/TELC A1·A2·B1. AI sinh đề từ kho đề thi thật (RAG), chấm điểm và nhận xét chi tiết bằng tiếng Việt.
        </p>

        <div className="fade-up-3" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 42 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/words" className="btn-glow" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 14, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: 'white', fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 8px 32px rgba(99,102,241,.45)' }}>
              Học miễn phí ngay<IconArrow />
            </Link>
            <Link href="/pricing" className="btn-outline-hover" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 14, border: '1px solid rgba(255,255,255,.15)', color: 'white', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>
              Xem gói Premium
            </Link>
          </div>
          <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,.6)', margin: 0 }}>
            Không cần thẻ tín dụng · Miễn phí mãi mãi · 3 tính năng AI/tuần
          </p>
        </div>

        <div className="fade-up-4" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 840, marginBottom: 36 }}>
          {[
            { label: '5000+ từ vựng', color: STATUS.success, bg: 'rgba(34,197,94,.1)' },
            { label: '8 trò chơi', color: ACCENT.vocab, bg: 'rgba(139,92,246,.1)' },
            { label: 'AI chấm phát âm', color: ACCENT.xp, bg: 'rgba(245,158,11,.1)' },
            { label: 'RAG từ đề thi thật', color: ACCENT.listening, bg: 'rgba(236,72,153,.1)' },
            { label: 'SRS thông minh', color: ACCENT.srs, bg: 'rgba(59,130,246,.1)' },
          ].map(chip => (
            <span key={chip.label} style={{ padding: '6px 14px', borderRadius: 100, fontSize: 12.5, fontWeight: 600, background: chip.bg, color: chip.color, border: `1px solid ${chip.color}33` }}>{chip.label}</span>
          ))}
        </div>

        <div className="fade-up-4" style={{ width: 'min(100%, 1040px)', position: 'relative' }}>
          <div style={{ borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(255,255,255,.12)', boxShadow: '0 28px 80px rgba(0,0,0,.35)', background: 'rgba(255,255,255,.04)' }}>
            <Image
              src="/marketing/screenshots/dashboard.png"
              alt="Ảnh xem trước dashboard Deutschmeister"
              width={1869}
              height={911}
              priority
              style={{ display: 'block', width: '100%', height: 'auto' }}
            />
          </div>
          <div className="hide-mobile" style={{ position: 'absolute', right: 24, bottom: -34, display: 'flex', gap: 14 }}>
            {[
              { src: '/marketing/screenshots/practice.svg', alt: 'Ảnh xem trước luyện kỹ năng' },
              { src: '/marketing/screenshots/games.svg', alt: 'Ảnh xem trước trò chơi luyện từ' },
            ].map((shot) => (
              <div key={shot.src} style={{ width: 220, borderRadius: 18, overflow: 'hidden', border: '1px solid rgba(255,255,255,.14)', boxShadow: '0 18px 48px rgba(0,0,0,.28)', background: '#111827' }}>
                <Image src={shot.src} alt={shot.alt} width={1200} height={760} style={{ display: 'block', width: '100%', height: 'auto' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats bar ──────────────────────────────────────────────────────── */}
      <section style={{ background: 'rgba(255,255,255,.03)', borderTop: '1px solid rgba(255,255,255,.06)', borderBottom: '1px solid rgba(255,255,255,.06)', padding: '24px 24px' }}>
        <div className="stats-grid" style={{ maxWidth: 560, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'center' }}>
          {[
            { num: `${publicStats.totalWords}+`, label: 'Từ vựng', sub: 'chuẩn Goethe' },
            ...STATIC_STATS,
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.num}</div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'white', marginTop: 3 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', marginTop: 1 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Core Features ──────────────────────────────────────────────────── */}
      <section id="features" style={{ padding: '96px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 100, background: 'rgba(99,102,241,.12)', border: '1px solid rgba(99,102,241,.3)', fontSize: 12.5, fontWeight: 700, color: '#a78bfa', marginBottom: 16 }}>
            <IconZap /> TÍNH NĂNG CỐT LÕI
          </div>
          <h2 className="section-title" style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-1px', marginBottom: 12 }}>Mọi thứ bạn cần để <span className="gradient-text">học tiếng Đức</span></h2>
          <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 15, maxWidth: 550, margin: '0 auto', lineHeight: 1.7 }}>Từ nền tảng từ vựng đến luyện thi chính thức — một nền tảng hoàn chỉnh.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {CORE_FEATURES.map((f, i) => {
            const Ic = f.icon;
            return (
              <div key={i} className="card-hover glow-border" style={{ borderRadius: 20, padding: '28px 24px', background: 'rgba(255,255,255,.03)' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: f.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, color: 'white' }}><Ic /></div>
                <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: f.bg, color: f.gradient.includes(STATUS.success) ? '#4ade80' : f.gradient.includes(ACCENT.vocab) ? '#c4b5fd' : f.gradient.includes(ACCENT.srs) ? '#93c5fd' : '#fbbf24', marginBottom: 12 }}>{f.badge}</span>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10, color: 'white' }}>{f.title}</h3>
                <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,.5)', lineHeight: 1.7, marginBottom: 18 }}>{f.desc}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {f.points.map((pt, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: 'rgba(255,255,255,.65)' }}>
                      <span style={{ color: STATUS.success, marginTop: 1, flexShrink: 0 }}><IconCheck /></span>{pt}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── AI Features ────────────────────────────────────────────────────── */}
      <section id="ai" style={{ padding: '96px 24px', background: 'rgba(99,102,241,.04)', borderTop: '1px solid rgba(99,102,241,.1)', borderBottom: '1px solid rgba(99,102,241,.1)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 100, background: 'rgba(245,158,11,.12)', border: '1px solid rgba(245,158,11,.3)', fontSize: 12.5, fontWeight: 700, color: '#fbbf24', marginBottom: 16 }}>
              <IconSparkles /> AI hỗ trợ luyện thi
            </div>
            <h2 className="section-title" style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-1px', marginBottom: 12 }}>AI làm thầy giáo <span className="gradient-text-amber">24/7 của bạn</span></h2>
            <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 15, maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>Sinh đề từ kho đề thi thật bằng RAG — phân tích, chấm điểm và nhận xét chi tiết bằng tiếng Việt giúp bạn cải thiện từng ngày.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {AI_FEATURES.map((f, i) => {
              const Ic = f.icon;
              return (
                <div key={i} className="card-hover" style={{ borderRadius: 20, padding: '28px 24px', background: `linear-gradient(135deg, rgba(${hexToRgb(f.color)}, .08) 0%, rgba(10,15,30,.8) 100%)`, border: `1px solid rgba(${hexToRgb(f.color)}, .2)`, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: `radial-gradient(circle, rgba(${hexToRgb(f.color)}, .15) 0%, transparent 70%)`, pointerEvents: 'none' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `rgba(${hexToRgb(f.color)}, .15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.color }}><Ic /></div>
                    <span style={{ fontSize: 13, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: `rgba(${hexToRgb(f.color)}, .12)`, color: f.color }}>{f.skill}</span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 10, color: 'white', lineHeight: 1.4 }}>{f.title}</h3>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', lineHeight: 1.7, marginBottom: 14 }}>{f.desc}</p>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: f.color, background: `rgba(${hexToRgb(f.color)}, .08)`, padding: '6px 12px', borderRadius: 8, display: 'inline-block' }}>{f.badge}</div>
                </div>
              );
            })}
          </div>
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '12px 24px', borderRadius: 14, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #4285F4, #34A853, #FBBC04, #EA4335)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: 'white' }}>G</div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>Gemini AI</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)' }}>Multimodal AI Engine</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Exam Formats ───────────────────────────────────────────────────── */}
      <section id="exam" style={{ padding: '96px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 100, background: 'rgba(245,158,11,.12)', border: '1px solid rgba(245,158,11,.3)', fontSize: 12.5, fontWeight: 700, color: '#fbbf24', marginBottom: 16 }}>
            <IconGraduate /> LUYỆN THI CHUẨN
          </div>
          <h2 className="section-title" style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-1px', marginBottom: 12 }}>Đề thi <span className="gradient-text-amber">Goethe & TELC</span> sinh từ đề thật</h2>
          <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 15, maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>AI học từ kho đề thi Goethe/TELC thật (RAG), sinh đề mới đúng format, đúng độ khó, đúng Teile. Cả 4 kỹ năng: Nghe · Đọc · Viết · Nói.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 40 }}>
          {['Goethe-Zertifikat', 'TELC Deutsch'].map((name, idx) => (
            <div key={name} className="glow-border-amber card-hover" style={{ borderRadius: 20, padding: '28px', background: 'rgba(245,158,11,.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ fontSize: 24 }}>{idx === 0 ? '🏆' : '🏆'}</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: 'white' }}>{name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)' }}>A1 · A2 · B1</div>
                </div>
              </div>
              {EXAM_LEVELS.map(l => (
                <div key={l.level} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                  <span style={{ minWidth: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #F59E0B, #EF4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: 'white' }}>{l.level}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 2 }}>{l.desc}</div>
                    <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.6)' }}>{l.teile} kỹ năng · {l.time} phút</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { skill: 'Đọc', icon: IconBook, color: STATUS.success, desc: 'Đề chuẩn đầy đủ Teile Lesen' },
            { skill: 'Nghe', icon: IconHeadphones, color: ACCENT.listening, desc: 'Audio Hören chuẩn định dạng' },
            { skill: 'Viết', icon: IconPen, color: ACCENT.writing, desc: 'Schreiben với AI chấm điểm' },
            { skill: 'Nói', icon: IconMic, color: ACCENT.xp, desc: 'Sprechen với AI phân tích audio' },
          ].map(s => {
            const Ic = s.icon;
            return (
              <div key={s.skill} style={{ borderRadius: 16, padding: '20px 16px', textAlign: 'center', background: `rgba(${hexToRgb(s.color)}, .06)`, border: `1px solid rgba(${hexToRgb(s.color)}, .2)` }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `rgba(${hexToRgb(s.color)}, .15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, margin: '0 auto 12px' }}><Ic /></div>
                <div style={{ fontWeight: 800, fontSize: 15, color: 'white', marginBottom: 4 }}>{s.skill}</div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.6)', lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Games ──────────────────────────────────────────────────────────── */}
      <section id="games" style={{ padding: '96px 24px', background: 'rgba(139,92,246,.04)', borderTop: '1px solid rgba(139,92,246,.1)', borderBottom: '1px solid rgba(139,92,246,.1)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 100, background: 'rgba(139,92,246,.12)', border: '1px solid rgba(139,92,246,.3)', fontSize: 12.5, fontWeight: 700, color: '#c4b5fd', marginBottom: 16 }}>
              <IconGamepad /> 8 TRÒ CHƠI HỌC TỪ
            </div>
            <h2 className="section-title" style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-1px', marginBottom: 12 }}>Học mà như <span className="gradient-text">đang chơi</span></h2>
            <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 15, maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>8 mini-game đa dạng giúp ôn từ vựng một cách tự nhiên và không nhàm chán.</p>
          </div>
          <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {GAMES.map(g => {
              const Ic = g.icon;
              return (
              <div key={g.name} className="card-hover" style={{ borderRadius: 16, padding: '20px 16px', textAlign: 'center', background: `rgba(${hexToRgb(g.color)}, .06)`, border: `1px solid rgba(${hexToRgb(g.color)}, .18)` }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: `rgba(${hexToRgb(g.color)}, .15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: g.color, margin: '0 auto 12px' }}>
                  <Ic size={22} />
                </div>
                <div style={{ fontWeight: 800, fontSize: 13.5, color: 'white', marginBottom: 4 }}>{g.name}</div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.6)' }}>{g.vi}</div>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Demo Quiz ──────────────────────────────────────────────────────── */}
      <section id="demo" style={{ padding: '96px 24px', maxWidth: 560, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 100, background: 'rgba(59,130,246,.12)', border: '1px solid rgba(59,130,246,.3)', fontSize: 12.5, fontWeight: 700, color: '#60A5FA', marginBottom: 16 }}>
            THỬ NGAY
          </div>
          <h2 className="section-title" style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-1px', marginBottom: 12 }}>
            Der, Die hay <span className="gradient-text">Das</span>?
          </h2>
          <p style={{ color: 'rgba(255,255,255,.55)', fontSize: 15, lineHeight: 1.7, maxWidth: 420, margin: '0 auto' }}>
            Thử sức với 10 câu hỏi mạo từ tiếng Đức — không cần đăng nhập.
          </p>
        </div>
        <LandingDemoQuiz />
      </section>

      <LandingStory />

      <LandingFaq />

      <LandingFinalCta />

      </main>

      <LandingFooter />
    </div>
  );
}
