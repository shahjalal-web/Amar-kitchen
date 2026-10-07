'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { UserRole } from '../../store/authStore';
import Link from 'next/link';
import RoleLink from './RoleLink';
import type { Highlights } from './highlights';

// প্ল্যাটফর্মের শুরুর ভিত্তি সংখ্যা — আসল অনুমোদিত কিচেনের সংখ্যা এর সাথে যোগ হয়
const BASE_KITCHENS = 500;
const SLIDE_MS = 7000;
const bn = (n: number) => n.toLocaleString('bn-BD');

interface Slide {
  role: Exclude<UserRole, 'admin'>;
  tab: string;
  short: string; // মোবাইলে ট্যাবের ছোট নাম
  badge: string;
  title: [string, string];
  sub: string;
  cta: { label: string; loggedLabel: string };
  more: { href: string; label: string };
  stats: { num: string; label: string }[];
  gradient: string;
  emojis: string[];
}

function buildSlides(h: Highlights | null): Slide[] {
  const kitchens = BASE_KITCHENS + (h?.stats.kitchens ?? 0);
  return [
    {
      role: 'user',
      tab: '🍽️ খাবার খুঁজছেন',
      short: '🍽️ খাবার',
      badge: 'রোজকার খাবারে ঘরের স্বাদ',
      title: ['মায়ের হাতের স্বাদ,', 'এখন পাড়াতেই'],
      sub: 'ব্যাচেলর, কর্মজীবী কিংবা শিক্ষার্থী — রোজ হোটেলের তেল-মশলা আর নয়। পাশের বাসার গৃহিণীর যত্নে রাঁধা গরম ভাত-তরকারি পৌঁছে যাবে আপনার দরজায়।',
      cta: { label: '🍽️ আজকের মেনু দেখুন', loggedLabel: '🍽️ আজকের মেনু দেখুন' },
      more: { href: '#how', label: 'কীভাবে কাজ করে' },
      stats: [
        { num: `${bn(kitchens)}+`, label: 'হোম কিচেন' },
        { num: h?.stats.areas ? `${bn(h.stats.areas)}+` : 'শতাধিক', label: 'এলাকায় সেবা' },
        { num: '৳২০', label: 'থেকে ডেলিভারি' },
      ],
      gradient: 'linear-gradient(135deg, #166534 0%, #15803d 40%, #0d9488 100%)',
      emojis: ['🍱', '🍛', '🥘', '🍲', '🥗', '🍚', '🫕', '🥙', '🍜', '🫔'],
    },
    {
      role: 'kitchen',
      tab: '👩‍🍳 রাঁধতে ভালোবাসেন',
      short: '👩‍🍳 কিচেন',
      badge: 'গৃহিণীদের জন্য ঘরে বসে আয়',
      title: ['আপনার রান্নাই হোক', 'আপনার আয়'],
      sub: 'সংসার সামলে, ঘরে বসেই। নিজের মেনু, নিজের দাম, নিজের সময় — শখের রান্না থেকে প্রতি মাসে বাড়তি আয় করুন, গ্রাহক খুঁজে দেব আমরা।',
      cta: { label: '👩‍🍳 কিচেন খুলুন', loggedLabel: '👩‍🍳 আমার কিচেন' },
      more: { href: '#kitchen', label: 'আয়ের হিসাব দেখুন' },
      stats: [
        { num: '৳০', label: 'রেজিস্ট্রেশন ফি' },
        { num: '১০%', label: 'শুধু বিক্রিতে কমিশন' },
        { num: 'নিজেই', label: 'দাম ও লিমিট ঠিক করুন' },
      ],
      gradient: 'linear-gradient(135deg, #9a3412 0%, #c2410c 40%, #b45309 100%)',
      emojis: ['👩‍🍳', '🍳', '🥄', '🧂', '🌶️', '🧄', '🍲', '🫓', '🥘', '💰'],
    },
    {
      role: 'delivery',
      tab: '🛵 অবসরে আয়',
      short: '🛵 ডেলিভারি',
      badge: 'ছাত্র ও চাকরিজীবীদের জন্য',
      title: ['নিজের এলাকায় ডেলিভারি,', 'নিজের সময়ে'],
      sub: 'যখন সময় পান, তখন অ্যাক্টিভ হোন। কাছের কিচেন থেকে খাবার তুলে কাছের ঠিকানায় পৌঁছে দিন — প্রতিটি ডেলিভারিতে নিশ্চিত আয়, দূরে ছোটাছুটি নেই।',
      cta: { label: '🛵 ডেলিভারি পার্টনার হোন', loggedLabel: '🛵 আমার ডেলিভারি' },
      more: { href: '/join/delivery', label: 'কীভাবে কাজ করে →' },
      stats: [
        { num: '৫ কিমি', label: 'এর মধ্যেই সব ডেলিভারি' },
        { num: '৯২%', label: 'ডেলিভারি চার্জ আপনার' },
        { num: 'যখন খুশি', label: 'অ্যাক্টিভ বা অফ' },
      ],
      gradient: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 45%, #4338ca 100%)',
      emojis: ['🛵', '📦', '🗺️', '⏱️', '🏢', '🛵', '📍', '💵', '🏠', '🚦'],
    },
  ];
}

interface Props {
  highlights: Highlights | null;
}

export default function HeroCarousel({ highlights }: Props) {
  const slides = buildSlides(highlights);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);

  const go = useCallback((i: number) => setActive((i + slides.length) % slides.length), [slides.length]);

  // নিজে থেকে স্লাইড বদল — হাত রাখলে/চাপলে থামে, "কম অ্যানিমেশন" সেটিং থাকলে চলে না
  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setTimeout(() => go(active + 1), SLIDE_MS);
    return () => clearTimeout(t);
  }, [active, paused, go]);

  // প্যারালাক্স: স্ক্রলে রি-রেন্ডার না করে সরাসরি transform বদলাই (মোবাইলে মসৃণ)
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (parallaxRef.current) parallaxRef.current.style.transform = `translateY(${window.scrollY * 0.35}px)`;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame); };
  }, []);

  return (
    <section
      className="relative min-h-svh flex items-center overflow-hidden"
      aria-roledescription="carousel"
      aria-label="শখের কিচেন — পরিচিতি"
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; setPaused(true); }}
      onTouchEnd={(e) => {
        const start = touchX.current;
        touchX.current = null;
        setPaused(false);
        if (start === null) return;
        const dx = e.changedTouches[0].clientX - start;
        if (Math.abs(dx) > 50) go(active + (dx < 0 ? 1 : -1));
      }}
    >
      {/* প্রতিটি স্লাইডের নিজস্ব রঙ — আস্তে আস্তে মিলিয়ে বদলায় */}
      {slides.map((s, i) => (
        <div key={s.role} className="absolute inset-0 transition-opacity duration-1000" style={{ background: s.gradient, opacity: i === active ? 1 : 0 }} aria-hidden="true" />
      ))}

      {/* ভাসমান খাবার — স্লাইড অনুযায়ী বদলায় */}
      <div ref={parallaxRef} className="absolute inset-0 pointer-events-none" style={{ willChange: 'transform' }} aria-hidden="true">
        {slides.map((s, si) => (
          <div key={s.role} className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: si === active ? 1 : 0 }}>
            {s.emojis.map((emoji, i) => (
              <span
                key={i}
                className="absolute select-none float-animate"
                style={{
                  fontSize: `${3 + (i % 3) * 1.2}rem`,
                  left: `${4 + i * 9.2}%`,
                  top: `${8 + ((i * 37) % 72)}%`,
                  opacity: 0.35 + (i % 3) * 0.15,
                  animationDelay: `${i * 0.35}s`,
                  animationDuration: `${4 + (i % 3) * 1.2}s`,
                  filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
                }}
              >
                {emoji}
              </span>
            ))}
          </div>
        ))}
      </div>

      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-32 text-center">
        {/* শুধু লেখা/বোতামের উপর মাউস রাখলে থামে — পুরো হিরোতে নয়, নইলে ডেস্কটপে কখনো বদলাত না */}
        <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        {/* কে কোন স্লাইড — ট্যাব */}
        <div className="hero-badge flex justify-center gap-1.5 sm:gap-2 mb-8" role="tablist" aria-label="কার জন্য">
          {slides.map((s, i) => (
            <button
              key={s.role}
              role="tab"
              aria-selected={i === active}
              onClick={() => go(i)}
              className={`relative overflow-hidden text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 rounded-full border backdrop-blur-sm transition ${
                i === active ? 'bg-white text-stone-800 border-white shadow-lg' : 'bg-white/10 text-white/85 border-white/25 hover:bg-white/20'
              }`}
            >
              <span className="sm:hidden">{s.short}</span>
              <span className="hidden sm:inline">{s.tab}</span>
              {/* বর্তমান স্লাইডের সময়ের দাগ */}
              {i === active && !paused && (
                <span key={active} className="hero-progress absolute left-0 bottom-0 h-0.5 bg-green-500" style={{ animationDuration: `${SLIDE_MS}ms` }} />
              )}
            </button>
          ))}
        </div>

        {/* সব স্লাইড একই ঘরে — উচ্চতা স্থির থাকে, শুধু দৃশ্যমানটা বদলায় */}
        <div className="grid">
          {slides.map((s, i) => {
            const on = i === active;
            return (
              <div
                key={s.role}
                role="tabpanel"
                aria-hidden={!on}
                inert={!on}
                className={`col-start-1 row-start-1 transition-all duration-700 ${on ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'}`}
              >
                <p className="text-yellow-300 font-semibold text-sm sm:text-base tracking-wide mb-4">{s.badge}</p>
                <h1 className="text-4xl sm:text-7xl font-extrabold text-white leading-tight mb-6 drop-shadow-lg">
                  {s.title[0]}<br />
                  <span className="text-yellow-300 drop-shadow-xl">{s.title[1]}</span>
                </h1>
                <p className="text-lg sm:text-2xl text-white/85 max-w-2xl mx-auto mb-10 leading-relaxed">{s.sub}</p>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-14">
                  {/* লগইন থাকলে: নিজের রোলের স্লাইডে ড্যাশবোর্ড, অন্য রোলের স্লাইডে লগআউটের অনুমতি চেয়ে নতুন একাউন্ট */}
                  <RoleLink
                    role={s.role}
                    label={s.cta.label}
                    loggedLabel={s.cta.loggedLabel}
                    className="btn-shine bg-white text-stone-800 font-bold text-lg px-10 py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-200"
                  />
                  <Link
                    href={s.more.href}
                    className="border-2 border-white/60 text-white font-bold text-lg px-10 py-4 rounded-2xl hover:bg-white/10 hover:border-white hover:-translate-y-1 backdrop-blur-sm transition-all duration-200"
                  >
                    {s.more.label}
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-4 sm:gap-6 max-w-lg mx-auto">
                  {s.stats.map((st) => (
                    <div key={st.label} className="text-center">
                      <p className="text-2xl sm:text-3xl font-extrabold text-yellow-300">{st.num}</p>
                      <p className="text-xs sm:text-sm text-white/70 mt-1">{st.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        </div>

        {/* নিচে ছোট বিন্দু (মোবাইলে সোয়াইপের ইঙ্গিত) */}
        <div className="flex justify-center gap-2 mt-10">
          {slides.map((s, i) => (
            <button
              key={s.role}
              onClick={() => go(i)}
              aria-label={`স্লাইড ${i + 1}`}
              className={`h-2 rounded-full transition-all ${i === active ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'}`}
            />
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 leading-none" aria-hidden="true">
        <svg viewBox="0 0 1440 90" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0,60 C240,90 480,20 720,50 C960,80 1200,20 1440,60 L1440,90 L0,90 Z" fill="#f0fdf4" />
        </svg>
      </div>
    </section>
  );
}
