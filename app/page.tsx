'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const FOOD_EMOJIS = ['🍱', '🍛', '🥘', '🍲', '🥗', '🍚', '🫕', '🥙', '🍜', '🫔'];

export default function HomePage() {
  const [scrollY, setScrollY] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('animate-in');
            observerRef.current?.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll('.scroll-animate').forEach((el) =>
      observerRef.current?.observe(el)
    );
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="overflow-x-hidden">
      {/* ─── HERO ─── */}
      <section
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #166534 0%, #15803d 40%, #0d9488 100%)' }}
      >
        {/* Parallax floating food layer — বেশি দেখা যাবে */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ transform: `translateY(${scrollY * 0.35}px)`, willChange: 'transform' }}
        >
          {FOOD_EMOJIS.map((emoji, i) => (
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

        {/* Glow orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-400/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-teal-300/20 rounded-full blur-3xl pointer-events-none" />

        {/* Hero content */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-32 text-center">
          <div className="hero-badge inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 text-white text-sm font-medium px-5 py-2 rounded-full mb-8">
            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            বাংলাদেশের প্রথম হোম কিচেন মার্কেটপ্লেস
          </div>

          <h1 className="hero-title text-5xl sm:text-7xl font-extrabold text-white leading-tight mb-6 drop-shadow-lg">
            ঘরের রান্না,<br />
            <span className="text-yellow-300 drop-shadow-xl">দোরগোড়ায়</span>
          </h1>

          <p className="hero-sub text-xl sm:text-2xl text-white/80 max-w-xl mx-auto mb-10 leading-relaxed">
            ব্যাচেলর বা কর্মজীবী? পাশের বাড়ির গৃহিণীর হাতের রান্না পান — সুস্থ, সুস্বাদু, সাশ্রয়ী।
          </p>

          <div className="hero-cta flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/register"
              className="btn-shine bg-white text-green-700 font-bold text-lg px-10 py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-200"
            >
              🍽️ এখনই অর্ডার করুন
            </Link>
            <Link
              href="/register?role=kitchen"
              className="border-2 border-white/60 text-white font-bold text-lg px-10 py-4 rounded-2xl hover:bg-white/10 hover:border-white hover:-translate-y-1 backdrop-blur-sm transition-all duration-200"
            >
              👩‍🍳 কিচেন খুলুন
            </Link>
          </div>

          <div className="hero-stats grid grid-cols-3 gap-6 max-w-md mx-auto">
            {[
              { num: '৫০০+', label: 'হোম কিচেন' },
              { num: '১০,০০০+', label: 'সুখী গ্রাহক' },
              { num: '১৫৳', label: 'থেকে ডেলিভারি' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-extrabold text-yellow-300">{s.num}</p>
                <p className="text-sm text-white/65 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0 leading-none">
          <svg viewBox="0 0 1440 90" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0,60 C240,90 480,20 720,50 C960,80 1200,20 1440,60 L1440,90 L0,90 Z" fill="#f0fdf4" />
          </svg>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 scroll-animate">
            <p className="text-green-600 font-semibold text-sm uppercase tracking-widest mb-3">কেন আলাদা?</p>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-stone-800 mb-4">
              শুধু খাবার নয়,<br />
              <span className="text-gradient">অভিজ্ঞতা</span>
            </h2>
            <p className="text-stone-500 text-lg max-w-xl mx-auto">
              রেস্তোরাঁর বিকল্প নয় — ঘরে রান্না করা মায়ের হাতের স্বাদ পাচ্ছেন কাছেই।
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '💰', title: 'সাশ্রয়ী মূল্য', desc: 'রেস্তোরাঁর চেয়ে ৩০–৫০% কম খরচে পুষ্টিকর ঘরের রান্না পান।', from: 'from-green-100', to: 'to-green-50', border: 'border-green-200', iconBg: 'bg-green-200' },
              { icon: '🥗', title: 'স্বাস্থ্যকর', desc: 'তেল, মশলা সব নিয়ন্ত্রণ করুন। জানেন রান্নাঘর কতটা পরিষ্কার।', from: 'from-emerald-100', to: 'to-emerald-50', border: 'border-emerald-200', iconBg: 'bg-emerald-200' },
              { icon: '📍', title: 'কাছেই আছেন', desc: 'আপনার বিল্ডিং বা পাশের গলিতেই আছেন অভিজ্ঞ গৃহিণী রাঁধুনি।', from: 'from-blue-100', to: 'to-blue-50', border: 'border-blue-200', iconBg: 'bg-blue-200' },
              { icon: '⚡', title: 'দ্রুত ডেলিভারি', desc: 'একই বিল্ডিংয়ে একাধিক অর্ডারে ডেলিভারি চার্জ মাত্র ১৫ টাকায় নামে।', from: 'from-purple-100', to: 'to-purple-50', border: 'border-purple-200', iconBg: 'bg-purple-200' },
            ].map((f, i) => (
              <div
                key={f.title}
                className={`scroll-animate bg-gradient-to-br ${f.from} ${f.to} border ${f.border} rounded-2xl p-7 group hover:-translate-y-3 hover:shadow-2xl transition-all duration-300 cursor-default`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className={`${f.iconBg} w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-stone-800 mb-2">{f.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-24 px-4 sm:px-6 bg-white relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-green-100 rounded-full opacity-60 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-100 rounded-full opacity-50 blur-3xl" />

        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-16 scroll-animate">
            <p className="text-green-600 font-semibold text-sm uppercase tracking-widest mb-3">সহজ প্রক্রিয়া</p>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-stone-800 mb-4">
              ৩ ধাপে<br />
              <span className="text-gradient">ঘরের রান্না</span>
            </h2>
          </div>

          <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-10">
            <div className="hidden sm:block absolute top-14 left-[22%] right-[22%] h-0.5 bg-gradient-to-r from-green-300 via-emerald-400 to-teal-300 z-0" />

            {[
              { step: '০১', icon: '📱', title: 'একাউন্ট খুলুন', desc: 'ইমেইল দিয়ে মিনিটেই রেজিস্ট্রেশন। আপনার বিল্ডিং ও এলাকার নাম দিন।' },
              { step: '০২', icon: '🔍', title: 'কিচেন বেছে নিন', desc: 'আশেপাশের হোম কিচেনের মেনু দেখুন, রেটিং যাচাই করুন, প্যাকেজ বেছে নিন।' },
              { step: '০৩', icon: '🛵', title: 'গরম খাবার পান', desc: 'রান্না হলে ডেলিভারি বয় পৌঁছে দেন। ইউনিক কোডে অর্ডার কনফার্ম।' },
            ].map((s, i) => (
              <div key={s.step} className="scroll-animate relative z-10 text-center" style={{ transitionDelay: `${i * 120}ms` }}>
                <div className="relative inline-block mb-6">
                  <div className="w-28 h-28 mx-auto bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center shadow-xl shadow-green-200 hover:scale-105 transition-transform duration-300">
                    <span className="text-5xl">{s.icon}</span>
                  </div>
                  <span className="absolute -top-2 -right-2 bg-stone-900 text-white text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center">{s.step}</span>
                </div>
                <h3 className="text-xl font-bold text-stone-800 mb-3">{s.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed max-w-xs mx-auto">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center scroll-animate">
            <Link
              href="/register"
              className="inline-block btn-shine bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-lg px-10 py-4 rounded-2xl shadow-lg shadow-green-200 hover:-translate-y-1 hover:shadow-xl transition-all duration-200"
            >
              এখনই চেষ্টা করুন →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CLUSTER DELIVERY ─── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="scroll-animate relative bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 rounded-3xl p-10 sm:p-16 text-white overflow-hidden">
            <div className="absolute -right-24 -top-24 w-72 h-72 bg-white/10 rounded-full blur-md" />
            <div className="absolute right-20 -bottom-16 w-52 h-52 bg-white/5 rounded-full" />
            <div className="absolute top-6 right-6 w-24 h-24 bg-yellow-400/20 rounded-full" />

            <div className="relative z-10 sm:flex items-center justify-between gap-12">
              <div className="mb-10 sm:mb-0 sm:max-w-lg">
                <div className="inline-flex items-center gap-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1.5 rounded-full mb-6">
                  ✨ ক্লাস্টার ডেলিভারি
                </div>
                <h2 className="text-3xl sm:text-5xl font-extrabold mb-5 leading-tight">
                  একই বিল্ডিং,<br />একসাথে ডেলিভারি
                </h2>
                <p className="text-white/80 text-lg leading-relaxed">
                  আপনার বিল্ডিংয়ে যত বেশি অর্ডার, ডেলিভারি চার্জ তত কম। ৫ জন মিলে অর্ডার করলে মাথাপিছু মাত্র ১৫ টাকা।
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { orders: '১ জন', charge: '৫০৳', sub: 'বেস চার্জ' },
                  { orders: '৩ জন', charge: '৩০৳', sub: 'প্রতিজন' },
                  { orders: '৫ জন', charge: '১৫৳', sub: 'প্রতিজন', best: true },
                ].map((row) => (
                  <div
                    key={row.orders}
                    className={`bg-white/20 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/30 hover:bg-white/30 transition-colors ${row.best ? 'ring-2 ring-yellow-400' : ''}`}
                  >
                    <p className="text-white/70 text-xs mb-2">{row.orders}</p>
                    <p className="text-3xl font-extrabold">{row.charge}</p>
                    <p className="text-white/60 text-xs mt-1">{row.sub}</p>
                    {row.best && <span className="mt-2 inline-block bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">সেরা!</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── KITCHEN OWNER CTA ─── */}
      <section className="py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="sm:flex items-center gap-16">
            <div className="sm:w-1/2 mb-12 sm:mb-0 scroll-animate">
              <div className="text-center sm:text-left text-8xl mb-6">👩‍🍳</div>
              <div className="inline-block bg-green-100 text-green-700 text-sm font-bold px-3 py-1.5 rounded-full mb-5">
                গৃহিণীদের জন্য সুযোগ
              </div>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-stone-800 mb-5 leading-tight">
                রান্নার দক্ষতাকে<br />
                <span className="text-gradient">আয়ে পরিণত করুন</span>
              </h2>
              <p className="text-stone-500 text-lg mb-8 leading-relaxed">
                ঘরে বসে প্রতি মাসে ১৫,০০০–৩০,০০০ টাকা উপার্জন করুন। নিজের হোম কিচেন খুলুন, আমরা গ্রাহক দেব।
              </p>
              <ul className="space-y-3 mb-10">
                {[
                  'অ্যাডমিন যাচাই করে নিরাপদে অনুমোদন',
                  'নিজের মেনু ও দাম নিজে ঠিক করুন',
                  'প্রতিদিনের আয় সরাসরি ওয়ালেটে',
                  'অর্ডার লিমিট নিজেই নিয়ন্ত্রণ করুন',
                  'প্রতিটি বিক্রয়ে মাত্র ১০% কমিশন',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-stone-600">
                    <span className="mt-0.5 flex-shrink-0 w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/register?role=kitchen"
                className="inline-block btn-shine bg-green-600 hover:bg-green-700 text-white font-bold text-lg px-9 py-4 rounded-2xl shadow-lg shadow-green-200 hover:-translate-y-1 hover:shadow-xl transition-all duration-200"
              >
                কিচেন রেজিস্ট্রেশন করুন →
              </Link>
            </div>

            <div className="sm:w-1/2 scroll-animate">
              <div className="relative">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 border border-green-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">র</div>
                    <div>
                      <p className="font-bold text-stone-800">রাহেলা আক্তার</p>
                      <p className="text-xs text-stone-400">কিচেন মালিক, মিরপুর</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1 text-yellow-500 font-bold text-sm">⭐ ৪.৯</div>
                  </div>

                  <div className="space-y-4 mb-6">
                    {[
                      { label: 'প্রতিদিন গড় অর্ডার', value: '৮টি', color: 'text-green-700' },
                      { label: 'প্রতি মিল দাম', value: '৮০–১২০৳', color: 'text-emerald-700' },
                      { label: 'মাসিক গড় আয়', value: '২২,৪০০৳', color: 'text-teal-700' },
                      { label: 'কমিশন কেটে হাতে', value: '২০,১৬০৳', color: 'text-blue-700' },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between py-3 border-b border-stone-100 last:border-0">
                        <span className="text-stone-500 text-sm">{row.label}</span>
                        <span className={`font-extrabold ${row.color}`}>{row.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-green-600 text-white rounded-xl p-4 text-center text-sm">
                    রেটিং ও রিভিউয়ের ভিত্তিতে আরও বেশি অর্ডার পান!
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 bg-yellow-400 text-yellow-900 font-extrabold text-sm px-4 py-2 rounded-full shadow-lg rotate-6 select-none">
                  ⭐ সেরা কিচেন
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── RESELL SECTION ─── */}
      <section className="py-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50" />
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-green-200/40 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto scroll-animate text-center">
          <div className="text-7xl mb-6">♻️</div>
          <div className="inline-block bg-green-100 text-green-700 text-sm font-bold px-4 py-1.5 rounded-full mb-6">অনন্য ফিচার</div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-stone-800 mb-5">
            বাতিল অর্ডার =<br />
            <span className="text-gradient">অন্যের সুযোগ</span>
          </h2>
          <p className="text-stone-500 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            কেউ অর্ডার বাতিল করলে সেটা স্বয়ংক্রিয়ভাবে ১৫% ডিসকাউন্টে রিসেল সেকশনে আসে। বাতিলকারী পায় রিফান্ড, নতুন ক্রেতা পায় ছাড়।
          </p>

          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-10">
            {[
              { icon: '❌', label: 'অর্ডার বাতিল', desc: 'কেউ বাতিল করে' },
              { icon: '♻️', label: 'রিসেল সেকশন', desc: '১৫% ছাড়ে যায়' },
              { icon: '🎉', label: 'সবাই খুশি', desc: 'রিফান্ড + ডিসকাউন্ট' },
            ].map((item, i) => (
              <div key={item.label} className="relative bg-white rounded-2xl p-5 shadow-sm border border-stone-100 text-center">
                {i < 2 && <span className="hidden sm:block absolute -right-3 top-1/2 -translate-y-1/2 text-stone-300 text-xl z-10">→</span>}
                <div className="text-3xl mb-2">{item.icon}</div>
                <p className="font-bold text-stone-700 text-sm">{item.label}</p>
                <p className="text-stone-400 text-xs mt-1">{item.desc}</p>
              </div>
            ))}
          </div>

          <Link
            href="/register"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold text-lg px-8 py-4 rounded-2xl hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
          >
            রিসেল অফার দেখুন
          </Link>
        </div>
      </section>

      {/* ─── ROLES ─── */}
      <section className="py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 scroll-animate">
            <h2 className="text-4xl font-extrabold text-stone-800 mb-3">আপনি কে?</h2>
            <p className="text-stone-500">প্ল্যাটফর্মে ৪ ধরনের ভূমিকা আছে</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {[
              { icon: '👤', role: 'গ্রাহক', desc: 'কাছের হোম কিচেন খুঁজুন, অর্ডার করুন', color: 'from-green-600 to-emerald-600', href: '/register', btnLabel: 'যোগ দিন' },
              { icon: '👩‍🍳', role: 'কিচেন মালিক', desc: 'নিজের রান্না বিক্রি করুন, আয় করুন', color: 'from-emerald-600 to-teal-600', href: '/register?role=kitchen', btnLabel: 'কিচেন খুলুন' },
              { icon: '🛵', role: 'ডেলিভারি বয়', desc: 'অর্ডার ডেলিভারি করুন, দৈনিক আয় করুন', color: 'from-blue-500 to-indigo-600', href: '/register?role=delivery', btnLabel: 'যোগ দিন' },
              { icon: '⚙️', role: 'অ্যাডমিন', desc: 'পুরো প্ল্যাটফর্ম পরিচালনা করুন', color: 'from-purple-500 to-violet-600', href: '/login', btnLabel: 'লগইন' },
            ].map((r, i) => (
              <div
                key={r.role}
                className="scroll-animate group bg-stone-50 rounded-2xl p-6 text-center border border-stone-100 hover:border-transparent hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className={`w-16 h-16 mx-auto rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                  {r.icon}
                </div>
                <h3 className="font-bold text-stone-800 mb-2">{r.role}</h3>
                <p className="text-stone-500 text-xs mb-5 leading-relaxed">{r.desc}</p>
                <Link
                  href={r.href}
                  className={`block w-full py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r ${r.color} hover:shadow-md transition-all duration-200`}
                >
                  {r.btnLabel}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-28 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-emerald-700" />
        <div className="absolute inset-0 opacity-15">
          {FOOD_EMOJIS.slice(0, 6).map((e, i) => (
            <span
              key={i}
              className="absolute float-animate select-none"
              style={{
                fontSize: '4rem',
                left: `${5 + i * 16}%`,
                top: `${15 + (i % 2) * 45}%`,
                animationDelay: `${i * 0.5}s`,
                filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.2))',
              }}
            >
              {e}
            </span>
          ))}
        </div>

        <div className="relative z-10 max-w-2xl mx-auto text-center scroll-animate">
          <h2 className="text-4xl sm:text-6xl font-extrabold text-white mb-5">আজই শুরু করুন</h2>
          <p className="text-white/75 text-xl mb-12 leading-relaxed">বিনামূল্যে একাউন্ট খুলুন। কোনো সাবস্ক্রিপশন ফি নেই।</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="btn-shine bg-white text-green-700 font-extrabold text-xl px-12 py-5 rounded-2xl shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all duration-200"
            >
              ফ্রি একাউন্ট খুলুন 🚀
            </Link>
            <Link
              href="/login"
              className="border-2 border-white/50 text-white font-bold text-xl px-12 py-5 rounded-2xl hover:bg-white/10 hover:border-white hover:-translate-y-1 transition-all duration-200"
            >
              লগইন করুন
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-stone-900 text-white py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="sm:flex justify-between gap-12 mb-12">
            <div className="mb-10 sm:mb-0 max-w-xs">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🍱</span>
                <span className="text-xl font-extrabold">আমার কিচেন</span>
              </div>
              <p className="text-stone-400 text-sm leading-relaxed">
                বাংলাদেশের প্রথম হোম কিচেন মার্কেটপ্লেস। ঘরের রান্না, দোরগোড়ায় পৌঁছে দেওয়া।
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-10">
              <div>
                <p className="font-bold text-stone-200 mb-4">প্ল্যাটফর্ম</p>
                <div className="space-y-2.5 text-sm text-stone-400">
                  <Link href="/register" className="block hover:text-green-400 transition">গ্রাহক হিসেবে যোগ দিন</Link>
                  <Link href="/register?role=kitchen" className="block hover:text-green-400 transition">কিচেন মালিক হন</Link>
                  <Link href="/register?role=delivery" className="block hover:text-green-400 transition">ডেলিভারি করুন</Link>
                </div>
              </div>
              <div>
                <p className="font-bold text-stone-200 mb-4">ফিচার</p>
                <div className="space-y-2.5 text-sm text-stone-400">
                  <p>ক্লাস্টার ডেলিভারি</p>
                  <p>রিসেল সেকশন</p>
                  <p>সাবস্ক্রিপশন</p>
                  <p>রিয়েল-টাইম ট্র্যাকিং</p>
                </div>
              </div>
              <div>
                <p className="font-bold text-stone-200 mb-4">যোগাযোগ</p>
                <div className="space-y-2.5 text-sm text-stone-400">
                  <p>📧 support@amarkitchen.com</p>
                  <p>📱 +৮৮০ ১৭০০-০০০০০০</p>
                  <p>📍 ঢাকা, বাংলাদেশ</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-stone-700 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-stone-500">
            <p>© ২০২৬ আমার কিচেন। সর্বস্বত্ব সংরক্ষিত।</p>
            <p className="text-stone-600">Made with ❤️ for Bangladesh</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
