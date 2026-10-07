'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { FoodPreview, FoodThumb } from '../shared/FoodViewer';
import { useAuthStore } from '../../store/authStore';
import HeroCarousel from './HeroCarousel';
import RoleLink, { DASHBOARD } from './RoleLink';
import type { Highlights } from './highlights';

const FOOD_EMOJIS = ['🍱', '🍛', '🥘', '🍲', '🥗', '🍚', '🫕', '🥙', '🍜', '🫔'];

export default function HomeClient({ highlights }: { highlights: Highlights | null }) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const user = useAuthStore((s) => s.user);

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
    document.querySelectorAll('.scroll-animate').forEach((el) => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);


  return (
    <div className="overflow-x-hidden">
      <HeroCarousel highlights={highlights} />

      {/* ─── জনপ্রিয় খাবার (সার্ভার থেকে ISR ডেটা) ─── */}
      {!!highlights?.foods.length && (
        <section className="pt-16 pb-4 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <p className="text-green-600 font-semibold text-sm tracking-widest mb-2">সবার পছন্দের তালিকা</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-800">যে খাবারগুলো বারবার অর্ডার হয়</h2>
              <p className="text-stone-500 mt-2">ছবিতে চাপ দিন — কাছ থেকে দেখুন</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {highlights.foods.map((f) => (
                <FoodPreview
                  key={f._id}
                  food={f}
                  className="block bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition"
                  footer={<RoleLink role="user" label="অর্ডার করতে একাউন্ট খুলুন →" loggedLabel="আজকের মেনু দেখুন →" className="block w-full text-center bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl" />}
                >
                  <FoodThumb food={f} className="w-full aspect-4/3" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px" />
                  <span className="block p-3">
                    <span className="block font-semibold text-stone-800 text-base">{f.name}</span>
                    <span className="block text-sm text-stone-500">{f.category}</span>
                  </span>
                </FoodPreview>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── কেন শখের কিচেন ─── */}
      <section className="py-20 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 scroll-animate">
            <p className="text-green-600 font-semibold text-sm tracking-widest mb-3">কেন শখের কিচেন</p>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-stone-800 mb-4 leading-tight">
              রেস্তোরাঁর চেয়ে আপন,<br />
              <span className="text-gradient">বাসার মতোই নিশ্চিন্ত</span>
            </h2>
            <p className="text-stone-500 text-base sm:text-lg max-w-xl mx-auto">
              প্রতিদিনের খাবারে যা চান — কম খরচ, পরিচ্ছন্ন রান্না আর চেনা স্বাদ — সব এক জায়গায়।
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {[
              { icon: '💰', title: 'পকেটে সাশ্রয়', desc: 'হোটেল-রেস্তোরাঁর চেয়ে অনেক কম দামে ভরপেট ঘরোয়া খাবার — প্রতিদিন, নিশ্চিন্তে।', from: 'from-green-100', to: 'to-green-50', border: 'border-green-200', iconBg: 'bg-green-200' },
              { icon: '🥗', title: 'যত্নে রাঁধা', desc: 'কম তেল, পরিমিত মশলা, পরিষ্কার রান্নাঘর — নিজের পরিবারের জন্য যেভাবে রাঁধেন, ঠিক সেভাবেই।', from: 'from-emerald-100', to: 'to-emerald-50', border: 'border-emerald-200', iconBg: 'bg-emerald-200' },
              { icon: '📍', title: 'একদম কাছেই', desc: 'আপনার এলাকা বা পাশের মহল্লার কিচেন — তাই খাবার পৌঁছায় গরম থাকতেই।', from: 'from-blue-100', to: 'to-blue-50', border: 'border-blue-200', iconBg: 'bg-blue-200' },
              { icon: '🤝', title: 'গৃহিণীদের পাশে', desc: 'প্রতিটি অর্ডারে একজন গৃহিণীর সম্মানের রোজগার বাড়ে — আপনার খাবারে মিশে থাকে সেই ভালোবাসা।', from: 'from-purple-100', to: 'to-purple-50', border: 'border-purple-200', iconBg: 'bg-purple-200' },
            ].map((f, i) => (
              <div
                key={f.title}
                className={`scroll-animate bg-linear-to-br ${f.from} ${f.to} border ${f.border} rounded-2xl p-6 sm:p-7 group hover:-translate-y-3 hover:shadow-2xl transition-all duration-300 cursor-default`}
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

      {/* ─── কীভাবে কাজ করে ─── */}
      <section id="how" className="py-20 sm:py-24 px-4 sm:px-6 bg-white relative overflow-hidden scroll-mt-16">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-green-100 rounded-full opacity-60 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-100 rounded-full opacity-50 blur-3xl" />

        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-14 scroll-animate">
            <p className="text-green-600 font-semibold text-sm tracking-widest mb-3">খুব সহজ</p>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-stone-800 mb-4 leading-tight">
              তিন ধাপে<br />
              <span className="text-gradient">গরম খাবার হাতে</span>
            </h2>
          </div>

          <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-10">
            <div className="hidden sm:block absolute top-14 left-[22%] right-[22%] h-0.5 bg-linear-to-r from-green-300 via-emerald-400 to-teal-300 z-0" />

            {[
              { step: '০১', icon: '📍', title: 'এলাকা বেছে নিন', desc: 'একাউন্ট খুলে ঠিকানা দিন — আপনার আশেপাশের কিচেনগুলো নিজে থেকেই সামনে চলে আসবে।' },
              { step: '০২', icon: '🍛', title: 'মেনু দেখে অর্ডার', desc: 'আজ কোন কিচেনে কী রান্না হচ্ছে দেখুন, রেটিং মিলিয়ে পছন্দেরটা বেছে নিন।' },
              { step: '০৩', icon: '🛵', title: 'দরজায় গরম খাবার', desc: 'রান্না শেষ হলেই খাবার রওনা দেয়। আপনার গোপন কোড মিললে তবেই ডেলিভারি সম্পন্ন।' },
            ].map((s, i) => (
              <div key={s.step} className="scroll-animate relative z-10 text-center" style={{ transitionDelay: `${i * 120}ms` }}>
                <div className="relative inline-block mb-6">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto bg-linear-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center shadow-xl shadow-green-200 hover:scale-105 transition-transform duration-300">
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
            <RoleLink
              role="user"
              label="এখনই শুরু করুন →"
              loggedLabel="আজকের মেনু দেখুন →"
              className="inline-block btn-shine bg-linear-to-r from-green-600 to-emerald-600 text-white font-bold text-lg px-10 py-4 rounded-2xl shadow-lg shadow-green-200 hover:-translate-y-1 hover:shadow-xl transition-all duration-200"
            />
          </div>
        </div>
      </section>

      {/* ─── একসাথে অর্ডারে সাশ্রয় (ক্লাস্টার ডেলিভারি) ─── */}
      <section className="py-20 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="scroll-animate relative bg-linear-to-br from-green-600 via-emerald-600 to-teal-700 rounded-3xl p-7 sm:p-16 text-white overflow-hidden">
            <div className="absolute -right-24 -top-24 w-72 h-72 bg-white/10 rounded-full blur-md" />
            <div className="absolute right-20 -bottom-16 w-52 h-52 bg-white/5 rounded-full" />

            <div className="relative z-10 sm:flex items-center justify-between gap-12">
              <div className="mb-8 sm:mb-0 sm:max-w-lg">
                <div className="inline-flex items-center gap-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1.5 rounded-full mb-6">
                  ✨ একসাথে অর্ডারে সাশ্রয়
                </div>
                <h2 className="text-3xl sm:text-5xl font-extrabold mb-5 leading-tight">
                  একই বিল্ডিং,<br />একসাথে ডেলিভারি
                </h2>
                <p className="text-white/85 text-base sm:text-lg leading-relaxed">
                  অফিস, মেস কিংবা অ্যাপার্টমেন্ট — একই বিল্ডিং থেকে যত বেশি অর্ডার, ডেলিভারি চার্জ তত কম। প্রতিবেশীদের সাথে মিলে অর্ডার করুন, সবাই কম দিন।
                </p>
              </div>

              <div>
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  {[
                    { orders: '১টি অর্ডার', charge: '৳২০', sub: 'সাধারণ চার্জ' },
                    { orders: '৩টি অর্ডার', charge: '৳১৬', sub: 'প্রতিজন' },
                    { orders: '৫টি অর্ডার', charge: '৳১২', sub: 'প্রতিজন', best: true },
                  ].map((row) => (
                    <div
                      key={row.orders}
                      className={`bg-white/20 backdrop-blur-sm rounded-2xl p-4 sm:p-5 text-center border border-white/30 hover:bg-white/30 transition-colors ${row.best ? 'ring-2 ring-yellow-400' : ''}`}
                    >
                      <p className="text-white/75 text-xs mb-2">{row.orders}</p>
                      <p className="text-2xl sm:text-3xl font-extrabold">{row.charge}</p>
                      <p className="text-white/65 text-xs mt-1">{row.sub}</p>
                      {row.best && <span className="mt-2 inline-block bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">সবচেয়ে সাশ্রয়ী</span>}
                    </div>
                  ))}
                </div>
                <p className="text-white/60 text-xs mt-3 text-center">* একই এলাকার কিচেন থেকে, একই দিনে অর্ডারের হিসাব</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── কিচেন মালিকদের জন্য ─── */}
      <section id="kitchen" className="py-20 sm:py-24 px-4 sm:px-6 bg-white scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="sm:flex items-center gap-16">
            <div className="sm:w-1/2 mb-12 sm:mb-0 scroll-animate">
              <div className="text-center sm:text-left text-7xl sm:text-8xl mb-6">👩‍🍳</div>
              <div className="inline-block bg-green-100 text-green-700 text-sm font-bold px-3 py-1.5 rounded-full mb-5">
                গৃহিণীদের জন্য
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-stone-800 mb-5 leading-tight">
                রান্নার হাতকে বানান<br />
                <span className="text-gradient">রোজগারের পথ</span>
              </h2>
              <p className="text-stone-500 text-base sm:text-lg mb-8 leading-relaxed">
                আপনার হাতের রান্নার প্রশংসা তো সবাই করে — এবার সেটাই হোক আয়ের উৎস। ঘরে বসে, সংসার সামলে, নিজের সুবিধামতো সময়ে।
              </p>
              <ul className="space-y-3 mb-10">
                {[
                  'বিনা খরচে রেজিস্ট্রেশন, তথ্য যাচাই শেষে দ্রুত অনুমোদন',
                  'কী রাঁধবেন, কত দামে — সিদ্ধান্ত পুরোটাই আপনার',
                  'দিনে কয়টা অর্ডার নেবেন, নিজেই ঠিক করুন',
                  'নিজে ডেলিভারি দিলে ডেলিভারি চার্জের আয়ও আপনার',
                  'বিক্রি হলে তবেই ১০% কমিশন — বাড়তি কোনো ফি নেই',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-stone-600">
                    <span className="mt-0.5 shrink-0 w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <RoleLink
                role="kitchen"
                label="আমার কিচেন খুলুন →"
                loggedLabel="আমার কিচেন →"
                className="inline-block btn-shine bg-green-600 hover:bg-green-700 text-white font-bold text-lg px-9 py-4 rounded-2xl shadow-lg shadow-green-200 hover:-translate-y-1 hover:shadow-xl transition-all duration-200"
              />
            </div>

            <div className="sm:w-1/2 scroll-animate">
              <div className="relative">
                <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-3xl p-6 sm:p-8 border border-green-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">র</div>
                    <div>
                      <p className="font-bold text-stone-800">রাহেলার রান্নাঘর</p>
                      <p className="text-xs text-stone-400">মিরপুর · একটি উদাহরণ হিসাব</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1 text-yellow-500 font-bold text-sm">⭐ ৪.৯</div>
                  </div>

                  <div className="space-y-1 mb-6">
                    {[
                      { label: 'দিনে গড় অর্ডার', value: '৮টি', color: 'text-green-700' },
                      { label: 'প্রতি প্লেটের দাম', value: '৮০–১২০৳', color: 'text-emerald-700' },
                      { label: 'মাসে মোট বিক্রি', value: '২২,৪০০৳', color: 'text-teal-700' },
                      { label: 'কমিশন বাদে হাতে', value: '২০,১৬০৳', color: 'text-blue-700' },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between py-3 border-b border-stone-100 last:border-0">
                        <span className="text-stone-500 text-sm">{row.label}</span>
                        <span className={`font-extrabold ${row.color}`}>{row.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-green-600 text-white rounded-xl p-4 text-center text-sm">
                    ভালো রেটিং মানেই আরো বেশি অর্ডার — স্বাদেই হোক আপনার পরিচয়।
                  </div>
                </div>
                <div className="absolute -top-4 -right-2 sm:-right-4 bg-yellow-400 text-yellow-900 font-extrabold text-sm px-4 py-2 rounded-full shadow-lg rotate-6 select-none">
                  ⭐ সেরা কিচেন
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── রিসেল ─── */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-emerald-50 via-green-50 to-teal-50" />
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-green-200/40 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto scroll-animate text-center">
          <div className="text-6xl sm:text-7xl mb-6">♻️</div>
          <div className="inline-block bg-green-100 text-green-700 text-sm font-bold px-4 py-1.5 rounded-full mb-6">এক দানা খাবারও নষ্ট নয়</div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-stone-800 mb-5 leading-tight">
            বাতিল অর্ডার,<br />
            <span className="text-gradient">অন্য কারো সুযোগ</span>
          </h2>
          <p className="text-stone-500 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            রান্না শুরুর পর কেউ অর্ডার বাতিল করলে খাবারটা ফেলে দেওয়া হয় না — ১৫% ছাড়ে চলে যায় রিসেল তালিকায়। কিচেনের পরিশ্রম বৃথা যায় না, আর আরেকজন পান কম দামে গরম খাবার।
          </p>

          <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-lg mx-auto mb-10">
            {[
              { icon: '❌', label: 'অর্ডার বাতিল', desc: 'রান্না শুরুর পর' },
              { icon: '♻️', label: 'রিসেল তালিকায়', desc: '১৫% ছাড়ে' },
              { icon: '🎉', label: 'খাবার বাঁচল', desc: 'আরেকজনের পাতে' },
            ].map((item, i) => (
              <div key={item.label} className="relative bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-stone-100 text-center">
                {i < 2 && <span className="hidden sm:block absolute -right-3 top-1/2 -translate-y-1/2 text-stone-300 text-xl z-10">→</span>}
                <div className="text-3xl mb-2">{item.icon}</div>
                <p className="font-bold text-stone-700 text-sm">{item.label}</p>
                <p className="text-stone-400 text-xs mt-1">{item.desc}</p>
              </div>
            ))}
          </div>

          <RoleLink
            role="user"
            label="আজকের রিসেল অফার দেখুন"
            loggedHref="/user/resell"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold text-lg px-8 py-4 rounded-2xl hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
          />
        </div>
      </section>

      {/* ─── আপনি কোন দলে ─── */}
      {!user && (
        <section className="py-20 sm:py-24 px-4 sm:px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 scroll-animate">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-800 mb-3">আপনি কোন দলে?</h2>
              <p className="text-stone-500 max-w-lg mx-auto">শখের কিচেন চলে তিনজনের হাত ধরে — যিনি খান, যিনি রাঁধেন, আর যিনি পৌঁছে দেন।</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                { icon: '👤', role: 'গ্রাহক', desc: 'রোজকার খাবারে ঘরের স্বাদ খুঁজছেন', color: 'from-green-600 to-emerald-600', href: '/register', btnLabel: 'খাবার খুঁজুন' },
                { icon: '👩‍🍳', role: 'কিচেন মালিক', desc: 'রান্না ভালোবাসেন, তা থেকে আয় করতে চান', color: 'from-emerald-600 to-teal-600', href: '/register?role=kitchen', btnLabel: 'কিচেন খুলুন' },
                { icon: '🛵', role: 'ডেলিভারি পার্টনার', desc: 'অবসরে নিজের এলাকাতেই আয় করতে চান', color: 'from-blue-500 to-indigo-600', href: '/register?role=delivery', btnLabel: 'যোগ দিন' },
              ].map((r, i) => (
                <div
                  key={r.role}
                  className="scroll-animate group bg-stone-50 rounded-2xl p-6 text-center border border-stone-100 hover:border-transparent hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  <div className={`w-16 h-16 mx-auto rounded-xl bg-linear-to-br ${r.color} flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                    {r.icon}
                  </div>
                  <h3 className="font-bold text-stone-800 mb-2">{r.role}</h3>
                  <p className="text-stone-500 text-sm mb-5 leading-relaxed">{r.desc}</p>
                  <Link
                    href={r.href}
                    className={`block w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-linear-to-r ${r.color} hover:shadow-md transition-all duration-200`}
                  >
                    {r.btnLabel}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── শেষ আহ্বান ─── */}
      <section className="py-24 sm:py-28 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-green-600 to-emerald-700" />
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
          <h2 className="text-3xl sm:text-6xl font-extrabold text-white mb-5 leading-tight">
            আজকের খাবারটা<br />হোক ঘরের মতো
          </h2>
          <p className="text-white/80 text-lg sm:text-xl mb-10 leading-relaxed">
            {user
              ? `${user.name.split(' ')[0]}, আপনার এলাকার কিচেনগুলোতে আজ কী রান্না হচ্ছে — দেখে নিন।`
              : 'একাউন্ট খোলা সম্পূর্ণ ফ্রি, কোনো মাসিক ফি নেই। এক মিনিটেই শুরু করুন।'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link
                href={DASHBOARD[user.role]}
                className="btn-shine bg-white text-green-700 font-extrabold text-xl px-12 py-5 rounded-2xl shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all duration-200"
              >
                {user.role === 'user' ? 'আজকের মেনু দেখুন 🍛' : 'আমার ড্যাশবোর্ড →'}
              </Link>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-stone-900 text-white py-14 sm:py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="sm:flex justify-between gap-12 mb-12">
            <div className="mb-10 sm:mb-0 max-w-xs">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🍱</span>
                <span className="text-xl font-extrabold">শখের কিচেন</span>
              </div>
              <p className="text-stone-400 text-sm leading-relaxed">
                পাড়ার গৃহিণীদের হাতের রান্না পৌঁছে যায় আপনার দরজায় — সাশ্রয়ে, যত্নে, ভালোবাসায়।
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-10">
              <div>
                <p className="font-bold text-stone-200 mb-4">যোগ দিন</p>
                <div className="space-y-2.5 text-sm text-stone-400">
                  <RoleLink role="user" label="গ্রাহক হিসেবে" className="block text-left hover:text-green-400 transition" />
                  <RoleLink role="kitchen" label="কিচেন মালিক হিসেবে" className="block text-left hover:text-green-400 transition" />
                  <RoleLink role="delivery" label="ডেলিভারি পার্টনার হিসেবে" className="block text-left hover:text-green-400 transition" />
                  <Link href="/join/delivery" className="block hover:text-green-400 transition">ডেলিভারি পার্টনার প্রোগ্রাম</Link>
                </div>
              </div>
              <div>
                <p className="font-bold text-stone-200 mb-4">সুবিধা</p>
                <div className="space-y-2.5 text-sm text-stone-400">
                  <p>একসাথে অর্ডারে ছাড়</p>
                  <p>রিসেল অফার</p>
                  <p>নিয়মিত খাবারের সাবস্ক্রিপশন</p>
                  <p>অর্ডারের প্রতিটি ধাপ ট্র্যাকিং</p>
                </div>
              </div>
              <div>
                <p className="font-bold text-stone-200 mb-4">যোগাযোগ</p>
                <div className="space-y-2.5 text-sm text-stone-400">
                  <p>📧 support@shokherkitchen.com</p>
                  <p>📱 +৮৮০ ১৭০০-০০০০০০</p>
                  <p>📍 ঢাকা, বাংলাদেশ</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-stone-700 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-stone-500">
            <p>© ২০২৬ শখের কিচেন। সর্বস্বত্ব সংরক্ষিত।</p>
            <p className="text-stone-600">ঘরের রান্না, ভালোবাসায় ❤️</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
