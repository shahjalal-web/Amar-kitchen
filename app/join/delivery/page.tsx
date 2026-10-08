import type { Metadata } from 'next';
import RoleLink from '../../components/home/RoleLink';

// ডেলিভারি পার্টনারদের জন্য পরিচিতি পেজ — পুরোপুরি স্ট্যাটিক (বিল্ডের সময় তৈরি, কোনো লোডিং নেই)
export const metadata: Metadata = {
  title: 'ডেলিভারি পার্টনার হোন — শখের কিচেন',
  description: 'নিজের এলাকায়, নিজের সময়ে খাবার ডেলিভারি করে আয় করুন। শখের কিচেনে ডেলিভারি পার্টনার হিসেবে যোগ দিন।',
  openGraph: {
    type: 'website',
    siteName: 'শখের কিচেন',
    locale: 'bn_BD',
    title: 'ডেলিভারি পার্টনার হোন — শখের কিচেন',
    description: 'নিজের এলাকায় ডেলিভারি, নিজের সময়ে আয় — প্রতিটি ডেলিভারি চার্জের ৯২% আপনার।',
  },
};

const STEPS = [
  { icon: '📝', title: 'রেজিস্ট্রেশন করুন', desc: 'নাম, ফোন আর জাতীয় পরিচয়পত্রের নম্বর দিন, আর যে এলাকাগুলোতে ডেলিভারি দিতে চান সেগুলো বেছে নিন।' },
  { icon: '✅', title: 'অনুমোদন পান', desc: 'আমাদের টিম আপনার তথ্য যাচাই করে একাউন্ট চালু করে দেবে।' },
  { icon: '🟢', title: 'অ্যাক্টিভ হোন', desc: 'যখন সময় পান, অ্যাপে "অ্যাক্টিভ" করুন। ব্যস্ত থাকলে "অফ" — কেউ অর্ডার পাঠাবে না।' },
  { icon: '📦', title: 'অর্ডার নিন ও তুলুন', desc: 'আপনার এলাকার খোলা অর্ডার থেকে পছন্দেরটা নিন, অথবা কিচেন সরাসরি আপনাকে দেবে। কিচেনে গিয়ে অর্ডারের কোড স্ক্যান করে খাবার তুলুন।' },
  { icon: '🏠', title: 'পৌঁছে দিন, আয় নিশ্চিত', desc: 'গ্রাহকের কাছ থেকে ৪ সংখ্যার গোপন কোড নিয়ে ডেলিভারি সম্পন্ন করুন। আয় সাথে সাথে আপনার হিসাবে যোগ হয়।' },
];

const RATES = [
  { distance: 'একই এলাকায়', charge: 20, earn: 'প্রায় ৳১৮' },
  { distance: '২ কিমি পর্যন্ত', charge: 25, earn: '৳২৩' },
  { distance: '৩.৫ কিমি পর্যন্ত', charge: 30, earn: 'প্রায় ৳২৮' },
  { distance: '৫ কিমি পর্যন্ত', charge: 40, earn: 'প্রায় ৳৩৭' },
];

const PERKS = [
  { icon: '⏰', title: 'নিজের সময়, নিজের নিয়ম', desc: 'কোনো নির্দিষ্ট শিফট নেই। ক্লাস বা অফিসের ফাঁকে, সকালে কিংবা সন্ধ্যায় — যখন সুবিধা।' },
  { icon: '📍', title: 'দূরে ছোটাছুটি নেই', desc: 'সব ডেলিভারি ৫ কিমির মধ্যে, আর আপনি নিজেই ঠিক করেন কোন এলাকায় কাজ করবেন।' },
  { icon: '🏢', title: 'এক যাত্রায় একাধিক অর্ডার', desc: 'একই বিল্ডিংয়ে কয়েকটি অর্ডার থাকলে একবারেই সব পৌঁছে দিন — সময় কম, আয় বেশি।' },
  { icon: '🔐', title: 'নিরাপদ হস্তান্তর', desc: 'কিচেনে কোড স্ক্যান, গ্রাহকের কাছে গোপন কোড — কোন খাবার কার হাতে গেল, সব পরিষ্কার।' },
];

const NEEDS = [
  'ইন্টারনেটসহ একটি স্মার্টফোন',
  'জাতীয় পরিচয়পত্র (NID)',
  'সাইকেল বা মোটরসাইকেল — খুব কাছের ডেলিভারিতে হেঁটেও চলে',
  'নিজের এলাকার রাস্তাঘাট চেনা',
];

const FAQ = [
  { q: 'প্রতিটি ডেলিভারিতে আমি কত পাব?', a: 'গ্রাহক যে ডেলিভারি চার্জ দেন তার ৯২% আপনার, প্ল্যাটফর্ম রাখে মাত্র ৮%। খাবার তোলার মুহূর্তেই আপনার আয় ঠিক হয়ে যায় — পরে হার বদলালেও সেই অর্ডারের আয় বদলায় না।' },
  { q: 'দিনে কতগুলো ডেলিভারি করতে হবে?', a: 'কোনো বাধ্যবাধকতা নেই। যতক্ষণ অ্যাক্টিভ থাকবেন, ততক্ষণ অর্ডার পাবেন। চাইলে দিনে একটি, চাইলে বিশটি।' },
  { q: 'কোন এলাকায় ডেলিভারি দেব, সেটা কি আমি বাছতে পারব?', a: 'হ্যাঁ। রেজিস্ট্রেশনের সময় এক বা একাধিক এলাকা বেছে নেবেন, পরে প্রোফাইল থেকে বদলাতেও পারবেন। শুধু সেই এলাকার অর্ডারই আপনাকে দেখানো হবে।' },
  { q: 'অফ থাকলে কী হয়?', a: 'অফ থাকলে নতুন কোনো অর্ডার আপনাকে দেওয়া হবে না, খোলা অর্ডারও দেখাবে না। তবে আগে নেওয়া অর্ডারগুলো শেষ করতে পারবেন।' },
  { q: 'গ্রাহক কোড না দিলে কী করব?', a: 'গ্রাহক চাইলে নিজের অ্যাপ থেকেও ডেলিভারি পাওয়া নিশ্চিত করতে পারেন। কোনো সমস্যা হলে ড্যাশবোর্ড থেকে কোড আবার পাঠানো যায়।' },
  { q: 'আমার আয়ের হিসাব কোথায় দেখব?', a: 'ড্যাশবোর্ডের "আয়" পাতায় প্রতিটি ডেলিভারির আয় আর মোট হিসাব দেখা যায়।' },
];

export default function DeliveryPartnerPage() {
  return (
    <div className="overflow-x-hidden bg-[#f0f7ff]">
      {/* ─── কীভাবে কাজ করে ─── */}
      <section id="steps" className="pt-28 sm:pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-blue-600 font-semibold text-sm tracking-widest mb-2">শুরু থেকে শেষ</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-800">পাঁচ ধাপে প্রথম আয়</h1>
          </div>
          <ol className="relative space-y-4 sm:space-y-0 sm:grid sm:grid-cols-5 sm:gap-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative bg-white rounded-2xl p-5 shadow-sm border border-blue-100 flex sm:block gap-4">
                <div className="shrink-0 w-14 h-14 rounded-2xl bg-linear-to-br from-blue-600 to-indigo-600 text-white text-2xl grid place-items-center shadow-md sm:mb-4 relative">
                  {s.icon}
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-stone-900 text-white text-[11px] font-bold grid place-items-center">{(i + 1).toLocaleString('bn-BD')}</span>
                </div>
                <div>
                  <h3 className="font-bold text-stone-800 mb-1">{s.title}</h3>
                  <p className="text-sm text-stone-500 leading-relaxed">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─── আয়ের হিসাব ─── */}
      <section className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto sm:flex gap-12 items-start">
          <div className="sm:w-1/2 mb-10 sm:mb-0">
            <p className="text-blue-600 font-semibold text-sm tracking-widest mb-2">স্বচ্ছ হিসাব</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-800 mb-4 leading-tight">প্রতিটি ডেলিভারিতে<br />কত পাবেন</h2>
            <p className="text-stone-500 leading-relaxed mb-6">
              চার্জ ঠিক হয় কিচেন থেকে গ্রাহকের রাস্তার দূরত্ব দেখে। গ্রাহকের দেওয়া ডেলিভারি চার্জের ৯২% সরাসরি আপনার — কোনো লুকানো কাটছাঁট নেই।
            </p>
            <div className="rounded-2xl bg-blue-50 border border-blue-100 p-5">
              <p className="text-xs text-blue-700 font-semibold mb-3">একটি উদাহরণ</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-stone-500">দিনে ডেলিভারি</span><b className="text-stone-800">১৫টি</b></div>
                <div className="flex justify-between"><span className="text-stone-500">গড় আয় প্রতি ডেলিভারি</span><b className="text-stone-800">প্রায় ৳২৫</b></div>
                <div className="flex justify-between border-t border-blue-100 pt-2"><span className="text-stone-500">দিনে আয়</span><b className="text-blue-700">প্রায় ৳৩৭৫</b></div>
                <div className="flex justify-between"><span className="text-stone-500">মাসে (২৬ দিন)</span><b className="text-blue-700 text-lg">প্রায় ৳৯,৭৫০</b></div>
              </div>
              <p className="text-[11px] text-stone-400 mt-3">* শুধু উদাহরণ — আসল আয় নির্ভর করে কতক্ষণ অ্যাক্টিভ থাকছেন, অর্ডারের সংখ্যা আর দূরত্বের ওপর।</p>
            </div>
          </div>
          <div className="sm:w-1/2">
            <div className="rounded-2xl border border-stone-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 text-stone-500 text-xs">
                  <tr><th className="text-left p-3 font-medium">দূরত্ব</th><th className="text-right p-3 font-medium">গ্রাহক দেন</th><th className="text-right p-3 font-medium">আপনি পান</th></tr>
                </thead>
                <tbody>
                  {RATES.map((r) => (
                    <tr key={r.distance} className="border-t border-stone-100">
                      <td className="p-3 text-stone-700">{r.distance}</td>
                      <td className="p-3 text-right text-stone-500">৳{r.charge.toLocaleString('bn-BD')}</td>
                      <td className="p-3 text-right font-bold text-blue-700">{r.earn}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-stone-400 mt-2">বর্তমান হার অনুযায়ী। একই বিল্ডিংয়ে একাধিক অর্ডারে গ্রাহকের চার্জ কিছুটা কমে, কিন্তু এক যাত্রায় কয়েকটি ডেলিভারি হয়ে যায়।</p>
          </div>
        </div>
      </section>

      {/* ─── সুবিধা ─── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-800 text-center mb-12">কেন শখের কিচেনের সাথে</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {PERKS.map((p) => (
              <div key={p.title} className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100 flex gap-4">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-blue-100 grid place-items-center text-2xl">{p.icon}</div>
                <div>
                  <h3 className="font-bold text-stone-800 mb-1">{p.title}</h3>
                  <p className="text-sm text-stone-500 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── যা লাগবে ─── */}
      <section className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-800 mb-3">শুরু করতে যা লাগবে</h2>
          <p className="text-stone-500 mb-10">কোনো রেজিস্ট্রেশন ফি নেই, কোনো জামানত নেই।</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {NEEDS.map((n) => (
              <li key={n} className="flex items-start gap-3 bg-stone-50 rounded-xl p-4 text-stone-700">
                <span className="shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold grid place-items-center">✓</span>
                {n}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── প্রশ্নোত্তর ─── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-800 text-center mb-10">সাধারণ প্রশ্ন</h2>
          <div className="space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="group bg-white rounded-2xl border border-blue-100 shadow-sm">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-3 p-5 font-semibold text-stone-800">
                  {f.q}
                  <span className="shrink-0 text-blue-600 text-xl transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="px-5 pb-5 -mt-1 text-sm text-stone-600 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── শেষ আহ্বান ─── */}
      <section className="py-20 px-4 sm:px-6 text-white text-center" style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #4338ca 100%)' }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-extrabold mb-4 leading-tight">আজ থেকেই শুরু হোক<br />আপনার বাড়তি আয়</h2>
          <p className="text-white/80 text-lg mb-8">রেজিস্ট্রেশনে লাগে মাত্র কয়েক মিনিট।</p>
          <RoleLink
            role="delivery"
            label="🛵 ডেলিভারি পার্টনার হোন"
            loggedLabel="🛵 আমার ডেলিভারি ড্যাশবোর্ড"
            className="inline-block btn-shine bg-white text-blue-800 font-extrabold text-lg px-10 py-4 rounded-2xl shadow-xl hover:-translate-y-1 transition-all duration-200"
          />
        </div>
      </section>
    </div>
  );
}
