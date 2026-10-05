'use client';
// ⚠️ শুধু টেস্টিংয়ের জন্য — এক ক্লিকে ডেমো/অ্যাডমিন একাউন্টে লগইন।
// শুধু development মোডে এবং .env.local-এ NEXT_PUBLIC_DEMO_LOGIN=true থাকলে দেখায়।
// সরাতে চাইলে: এই ফাইল মুছুন + login/page.tsx থেকে <DemoLoginPanel> লাইনটি মুছুন + .env.local-এর DEMO লাইনগুলো মুছুন।

const DEMO_PASSWORD = 'Demo@12345';
const DOMAIN = 'demo.shokherkitchen.com';

interface DemoAccount { label: string; sub: string; email: string; password: string }

const demo = (key: string, label: string, sub: string): DemoAccount => ({
  label, sub, email: `${key}@${DOMAIN}`, password: DEMO_PASSWORD,
});

const GROUPS: { title: string; accounts: DemoAccount[] }[] = [
  {
    title: '🛡️ অ্যাডমিন স্টাফ (রোল অনুযায়ী)',
    accounts: [
      demo('subadmin', 'রাশেদুল ইসলাম', 'সাব অ্যাডমিন'),
      demo('manager', 'নাদিয়া সুলতানা', 'ম্যানেজার'),
      demo('accounts', 'কামরুল হাসান', 'অ্যাকাউন্টস'),
      demo('support', 'মিতু আক্তার', 'কাস্টমার সাপোর্ট'),
      demo('moderator', 'তারেক মাহমুদ', 'কনটেন্ট মডারেটর'),
    ],
  },
  {
    title: '👩‍🍳 কিচেন',
    accounts: [
      demo('kitchen1', 'রহিমার রান্নাঘর', 'কান্দিরপাড়, কুমিল্লা'),
      demo('kitchen2', 'সালমার হেঁশেল', 'রাজগঞ্জ, কুমিল্লা'),
      demo('kitchen3', 'মায়ের হাতের রান্না', 'ঝাউতলা, কুমিল্লা'),
      demo('kitchen4', 'ফারহানার কিচেন', 'টমছম ব্রিজ, কুমিল্লা'),
      demo('kitchen5', 'ধানমন্ডি হোম কিচেন', 'ধানমন্ডি, ঢাকা'),
      demo('kitchen6', 'রোকসানার রসুই', 'মিরপুর ১০, ঢাকা'),
      demo('kitchen7', 'উত্তরা ঘরোয়া খাবার', 'উত্তরা সেক্টর ৭, ঢাকা'),
      demo('kitchen8', 'জান্নাতের হেঁশেল', 'মোহাম্মদপুর, ঢাকা'),
      demo('kitchen9', 'নতুন কিচেন', 'অ্যাপ্রুভালের অপেক্ষায়'),
    ],
  },
  {
    title: '🛵 ডেলিভারি বয়',
    accounts: [
      demo('delivery1', 'রাকিব হাসান', 'কান্দিরপাড়, রাজগঞ্জ… (কুমিল্লা)'),
      demo('delivery2', 'সজীব আহমেদ', 'ঝাউতলা, রেসকোর্স… (কুমিল্লা)'),
      demo('delivery3', 'তানভীর রহমান', 'রাজগঞ্জ, টমছম ব্রিজ… (কুমিল্লা)'),
      demo('delivery4', 'আরিফ হোসেন', 'ধানমন্ডি, কলাবাগান… (ঢাকা)'),
      demo('delivery5', 'মামুন মিয়া', 'মিরপুর ১০, মিরপুর ২… (ঢাকা)'),
      demo('delivery6', 'জুবায়ের আলম', 'অ্যাপ্রুভালের অপেক্ষায়'),
    ],
  },
  {
    title: '👤 গ্রাহক',
    accounts: [
      demo('user1', 'তানিয়া রহমান', 'কান্দিরপাড় + অফিস রাজগঞ্জ'),
      demo('user2', 'মাহমুদুল হাসান', 'কান্দিরপাড়, কুমিল্লা'),
      demo('user3', 'নুসরাত জাহান', 'ঝাউতলা, কুমিল্লা'),
      demo('user4', 'সাকিব আল মামুন', 'ধানমন্ডি + অফিস কারওয়ান বাজার'),
      demo('user5', 'ফাহিম মুনতাসির', 'মিরপুর ১০, ঢাকা'),
      demo('user6', 'ইশরাত জাহান', 'মোহাম্মদপুর, ঢাকা'),
      demo('user7', 'রাফি চৌধুরী', 'চকবাজার, কুমিল্লা'),
    ],
  },
];

export const isDemoLoginEnabled = () =>
  process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_DEMO_LOGIN === 'true';

export default function DemoLoginPanel({
  onLogin, busy,
}: { onLogin: (email: string, password: string) => void; busy: boolean }) {
  if (!isDemoLoginEnabled()) return null;

  const adminEmail = process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL;
  const adminPassword = process.env.NEXT_PUBLIC_DEMO_ADMIN_PASSWORD;
  const groups = adminEmail && adminPassword
    ? [{ title: '🛡️ অ্যাডমিন', accounts: [{ label: 'অ্যাডমিন', sub: adminEmail, email: adminEmail, password: adminPassword }] }, ...GROUPS]
    : GROUPS;

  return (
    <div className="mt-8 border-2 border-dashed border-amber-300 bg-amber-50 rounded-xl p-4">
      <p className="text-sm font-semibold text-amber-800">🧪 টেস্টিং: এক ক্লিকে লগইন</p>
      <p className="text-xs text-amber-700 mb-3">শুধু ডেভেলপমেন্টে দেখায়। ডেমো একাউন্টের পাসওয়ার্ড: {DEMO_PASSWORD}</p>
      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="text-xs font-medium text-stone-600 mb-1">{g.title}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {g.accounts.map((a) => (
                <button
                  key={a.email}
                  type="button"
                  disabled={busy}
                  onClick={() => onLogin(a.email, a.password)}
                  className="text-left bg-white hover:bg-green-50 border border-stone-200 hover:border-green-400 rounded-lg px-3 py-2 transition disabled:opacity-50"
                >
                  <p className="text-sm font-medium text-stone-800 truncate">{a.label}</p>
                  <p className="text-[11px] text-stone-500 truncate">{a.sub}</p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
