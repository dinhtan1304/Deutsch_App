'use client';

import { useState, useEffect } from 'react';
import { ACCENT, STATUS } from '@/lib/tokens';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
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

// ─── Static config (non-text) ──────────────────────────────────────────────
const CORE_FEATURES_STYLE = [
  { icon: IconBook, gradient: 'linear-gradient(135deg, #22C55E, #14B8A6)', bg: 'rgba(34,197,94,.07)' },
  { icon: IconGamepad, gradient: 'linear-gradient(135deg, #8B5CF6, #6366F1)', bg: 'rgba(139,92,246,.07)' },
  { icon: IconBrain, gradient: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', bg: 'rgba(59,130,246,.07)' },
  { icon: IconGraduate, gradient: 'linear-gradient(135deg, #F59E0B, #EF4444)', bg: 'rgba(245,158,11,.07)' },
] as const;

const AI_FEATURES_STYLE = [
  { key: 'listen', icon: IconHeadphones, color: ACCENT.listening },
  { key: 'write', icon: IconPen, color: ACCENT.writing },
  { key: 'speak', icon: IconMic, color: ACCENT.xp },
  { key: 'read', icon: IconBook, color: STATUS.success },
] as const;

const EXAM_LEVELS = [
  { level: 'A1', time: 70,  teile: 4, descKey: 'levelA1Desc' as const },
  { level: 'A2', time: 90,  teile: 4, descKey: 'levelA2Desc' as const },
  { level: 'B1', time: 120, teile: 4, descKey: 'levelB1Desc' as const },
];

const GAMES_STYLE = [
  { name: 'Quick Quiz',      labelKey: 'quickQuiz' as const,      icon: IconZap,        color: ACCENT.xp },
  { name: 'Gender Quiz',     labelKey: 'genderQuiz' as const,     icon: IconTarget,     color: STATUS.danger },
  { name: 'Flashcards',      labelKey: 'flashcards' as const,     icon: IconLayers,     color: ACCENT.writing },
  { name: 'Fill Blank',      labelKey: 'fillBlank' as const,      icon: IconPenTool,    color: STATUS.success },
  { name: 'Timed Challenge', labelKey: 'timedChallenge' as const, icon: IconClock,      color: ACCENT.listening },
  { name: 'Word Match',      labelKey: 'wordMatch' as const,      icon: IconLink,       color: ACCENT.teal },
  { name: 'Listening',       labelKey: 'listening' as const,      icon: IconHeadphones, color: ACCENT.vocab },
  { name: 'Spelling Bee',    labelKey: 'spelling' as const,       icon: IconSpellCheck, color: ACCENT.games },
];


export default function HomePage() {
  const router = useRouter();
  const t = useTranslations('landing');
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [publicStats, setPublicStats] = useState(DEMO_STATS);

  const navItems: Array<[string, string]> = [
    [t('navMenu.features'), '#features'],
    [t('navMenu.ai'), '#ai'],
    [t('navMenu.exam'), '#exam'],
    [t('navMenu.story'), '#story'],
    [t('navMenu.pricing'), '/pricing'],
  ];

  const coreFeatures = (['dictionary', 'games', 'srs', 'exam'] as const).map((key, i) => ({
    icon: CORE_FEATURES_STYLE[i]!.icon,
    title: t(`coreFeatures.${key}.title`),
    badge: t(`coreFeatures.${key}.badge`),
    desc: t(`coreFeatures.${key}.desc`),
    gradient: CORE_FEATURES_STYLE[i]!.gradient,
    bg: CORE_FEATURES_STYLE[i]!.bg,
    points: [
      t(`coreFeatures.${key}.point1`),
      t(`coreFeatures.${key}.point2`),
      t(`coreFeatures.${key}.point3`),
    ],
  }));

  const aiFeatures = AI_FEATURES_STYLE.map(({ key, icon, color }) => ({
    skill: t(`aiSection.${key}.skill`),
    title: t(`aiSection.${key}.title`),
    desc: t(`aiSection.${key}.desc`),
    badge: t(`aiSection.${key}.badge`),
    icon,
    color,
  }));

  const staticStats = [
    { num: '8',  label: t('stats.gamesLabel'), sub: t('stats.gamesSub') },
    { num: '4',  label: t('stats.skillsLabel'), sub: t('stats.skillsSub') },
  ];

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
          description: t('jsonLd.description'),
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
            {navItems.map(([label, href]) => (
              <a key={href} href={href} style={{ color: 'rgba(255,255,255,.65)', fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'color .2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,.65)')}>
                {label}
              </a>
            ))}
          </div>
          <div className="hide-mobile" style={{ display: 'flex', gap: 10 }}>
            <Link href="/auth/login" className="btn-outline-hover" style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid rgba(255,255,255,.2)', color: 'white', fontSize: 13.5, fontWeight: 600, textDecoration: 'none' }}>{t('navMenu.signIn')}</Link>
            <Link href="/words" className="btn-glow" style={{ padding: '8px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: 'white', fontSize: 13.5, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 14px rgba(99,102,241,.4)' }}>{t('navMenu.startNow')}</Link>
          </div>
          <button onClick={() => setMenuOpen(v => !v)} className="mobile-menu" aria-label={menuOpen ? t('navMenu.closeMenu') : t('navMenu.openMenu')} aria-expanded={menuOpen} style={{ display: 'none', background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 4 }}>
            {menuOpen ? <IconX /> : <IconMenu />}
          </button>
        </div>
        {menuOpen && (
          <div style={{ background: 'rgba(10,15,30,.98)', padding: '16px 24px 24px', borderTop: '1px solid rgba(255,255,255,.06)' }}>
            {navItems.map(([label, href]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '12px 0', color: 'rgba(255,255,255,.8)', fontSize: 15, fontWeight: 500, textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,.06)' }}>{label}</a>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <Link href="/auth/login" style={{ flex: 1, padding: '10px', textAlign: 'center', border: '1px solid rgba(255,255,255,.2)', borderRadius: 10, color: 'white', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>{t('navMenu.signIn')}</Link>
              <Link href="/words" style={{ flex: 1, padding: '10px', textAlign: 'center', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', borderRadius: 10, color: 'white', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>{t('navMenu.startFree')}</Link>
            </div>
          </div>
        )}
      </nav>
      </header>

      <main>
      {/* ─── Hero ───────────────────────────────────────────────────────────── */}
      <section style={{ minHeight: '92vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '116px 24px 56px', position: 'relative', overflow: 'hidden' }}>
        <div className="fade-up shimmer-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 100, marginBottom: 24, fontSize: 13, fontWeight: 600 }}>
          <IconSparkles /><span>{t('hero.badge')}</span>
        </div>

        <h1 className="fade-up-1 hero-title" style={{ fontSize: '4rem', fontWeight: 900, lineHeight: 1.1, textAlign: 'center', maxWidth: 800, margin: '0 0 20px', letterSpacing: '-1.5px' }}>
          {t('hero.titleStart')} <span className="gradient-text">{t('hero.titleAccent')}</span><br />{t('hero.titleEnd')}
        </h1>

        <p className="fade-up-2 hero-sub" style={{ fontSize: 16, color: 'rgba(255,255,255,.55)', textAlign: 'center', maxWidth: 640, lineHeight: 1.75, marginBottom: 40 }}>
          {t('hero.subtitle')}
        </p>

        <div className="fade-up-3" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 42 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/words" className="btn-glow" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 14, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: 'white', fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 8px 32px rgba(99,102,241,.45)' }}>
              {t('hero.ctaPrimary')}<IconArrow />
            </Link>
            <Link href="/pricing" className="btn-outline-hover" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 14, border: '1px solid rgba(255,255,255,.15)', color: 'white', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>
              {t('hero.ctaSecondary')}
            </Link>
          </div>
          <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,.6)', margin: 0 }}>
            {t('hero.ctaNote')}
          </p>
        </div>

        <div className="fade-up-4" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 840, marginBottom: 36 }}>
          {[
            { label: t('hero.chipWords'), color: STATUS.success, bg: 'rgba(34,197,94,.1)' },
            { label: t('hero.chipGames'), color: ACCENT.vocab, bg: 'rgba(139,92,246,.1)' },
            { label: t('hero.chipPronunciation'), color: ACCENT.xp, bg: 'rgba(245,158,11,.1)' },
            { label: t('hero.chipRag'), color: ACCENT.listening, bg: 'rgba(236,72,153,.1)' },
            { label: t('hero.chipSrs'), color: ACCENT.srs, bg: 'rgba(59,130,246,.1)' },
          ].map(chip => (
            <span key={chip.label} style={{ padding: '6px 14px', borderRadius: 100, fontSize: 12.5, fontWeight: 600, background: chip.bg, color: chip.color, border: `1px solid ${chip.color}33` }}>{chip.label}</span>
          ))}
        </div>

        <div className="fade-up-4" style={{ width: 'min(100%, 1040px)', position: 'relative' }}>
          <div style={{ borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(255,255,255,.12)', boxShadow: '0 28px 80px rgba(0,0,0,.35)', background: 'rgba(255,255,255,.04)' }}>
            <Image
              src="/marketing/screenshots/dashboard.png"
              alt={t('hero.dashboardAlt')}
              width={1869}
              height={911}
              priority
              style={{ display: 'block', width: '100%', height: 'auto' }}
            />
          </div>
          <div className="hide-mobile" style={{ position: 'absolute', right: 24, bottom: -34, display: 'flex', gap: 14 }}>
            {[
              { src: '/marketing/screenshots/practice.svg', alt: t('hero.practiceAlt') },
              { src: '/marketing/screenshots/games.svg', alt: t('hero.gamesAlt') },
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
            { num: `${publicStats.totalWords}+`, label: t('stats.wordsLabel'), sub: t('stats.wordsSub') },
            ...staticStats,
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
            <IconZap /> {t('coreFeatures.kicker')}
          </div>
          <h2 className="section-title" style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-1px', marginBottom: 12 }}>{t('coreFeatures.titleStart')} <span className="gradient-text">{t('coreFeatures.titleAccent')}</span></h2>
          <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 15, maxWidth: 550, margin: '0 auto', lineHeight: 1.7 }}>{t('coreFeatures.subtitle')}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {coreFeatures.map((f, i) => {
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
              <IconSparkles /> {t('aiSection.kicker')}
            </div>
            <h2 className="section-title" style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-1px', marginBottom: 12 }}>{t('aiSection.titleStart')} <span className="gradient-text-amber">{t('aiSection.titleAccent')}</span></h2>
            <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 15, maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>{t('aiSection.subtitle')}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {aiFeatures.map((f, i) => {
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
                <div style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{t('aiSection.geminiTitle')}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)' }}>{t('aiSection.geminiSub')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Exam Formats ───────────────────────────────────────────────────── */}
      <section id="exam" style={{ padding: '96px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 100, background: 'rgba(245,158,11,.12)', border: '1px solid rgba(245,158,11,.3)', fontSize: 12.5, fontWeight: 700, color: '#fbbf24', marginBottom: 16 }}>
            <IconGraduate /> {t('examSection.kicker')}
          </div>
          <h2 className="section-title" style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-1px', marginBottom: 12 }}>{t('examSection.titleStart')} <span className="gradient-text-amber">{t('examSection.titleAccent')}</span> {t('examSection.titleEnd')}</h2>
          <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 15, maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>{t('examSection.subtitle')}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 40 }}>
          {['Goethe-Zertifikat', 'TELC Deutsch'].map((name, idx) => (
            <div key={name} className="glow-border-amber card-hover" style={{ borderRadius: 20, padding: '28px', background: 'rgba(245,158,11,.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ fontSize: 24 }}>{idx === 0 ? '🏆' : '🏆'}</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: 'white' }}>{name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)' }}>{t('examSection.skillLevels')}</div>
                </div>
              </div>
              {EXAM_LEVELS.map(l => (
                <div key={l.level} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                  <span style={{ minWidth: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #F59E0B, #EF4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: 'white' }}>{l.level}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 2 }}>{t(`examSection.${l.descKey}`)}</div>
                    <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.6)' }}>{t('examSection.levelMeta', { teile: l.teile, time: l.time })}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { skill: t('examSection.skill4Read'), icon: IconBook, color: STATUS.success, desc: t('examSection.skill4ReadDesc') },
            { skill: t('examSection.skill4Listen'), icon: IconHeadphones, color: ACCENT.listening, desc: t('examSection.skill4ListenDesc') },
            { skill: t('examSection.skill4Write'), icon: IconPen, color: ACCENT.writing, desc: t('examSection.skill4WriteDesc') },
            { skill: t('examSection.skill4Speak'), icon: IconMic, color: ACCENT.xp, desc: t('examSection.skill4SpeakDesc') },
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
              <IconGamepad /> {t('gamesSection.kicker')}
            </div>
            <h2 className="section-title" style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-1px', marginBottom: 12 }}>{t('gamesSection.titleStart')} <span className="gradient-text">{t('gamesSection.titleAccent')}</span></h2>
            <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 15, maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>{t('gamesSection.subtitle')}</p>
          </div>
          <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {GAMES_STYLE.map(g => {
              const Ic = g.icon;
              return (
              <div key={g.name} className="card-hover" style={{ borderRadius: 16, padding: '20px 16px', textAlign: 'center', background: `rgba(${hexToRgb(g.color)}, .06)`, border: `1px solid rgba(${hexToRgb(g.color)}, .18)` }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: `rgba(${hexToRgb(g.color)}, .15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: g.color, margin: '0 auto 12px' }}>
                  <Ic size={22} />
                </div>
                <div style={{ fontWeight: 800, fontSize: 13.5, color: 'white', marginBottom: 4 }}>{g.name}</div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.6)' }}>{t(`gamesSection.${g.labelKey}`)}</div>
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
            {t('demoSection.kicker')}
          </div>
          <h2 className="section-title" style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-1px', marginBottom: 12 }}>
            {t('demoSection.titleStart')} <span className="gradient-text">{t('demoSection.titleAccent')}</span>{t('demoSection.titleSuffix')}
          </h2>
          <p style={{ color: 'rgba(255,255,255,.55)', fontSize: 15, lineHeight: 1.7, maxWidth: 420, margin: '0 auto' }}>
            {t('demoSection.subtitle')}
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
