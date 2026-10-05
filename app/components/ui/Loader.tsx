// লোডিং অ্যানিমেশন — কড়াই থেকে ধোঁয়া উঠছে, খুন্তি নড়ছে
// <Loader /> = পেজ/সেকশনের মাঝখানে; <Loader size="sm" inline /> = লাইনের ভেতরে ছোট
export default function Loader({
  label = 'রান্না হচ্ছে…',
  size = 'md',
  inline = false,
  className = '',
}: {
  label?: string | null;
  size?: 'sm' | 'md' | 'lg';
  inline?: boolean;
  className?: string;
}) {
  const px = size === 'sm' ? 36 : size === 'lg' ? 96 : 64;

  const pot = (
    <svg width={px} height={px} viewBox="0 0 64 64" aria-hidden="true" className="sk-loader shrink-0">
      {/* ধোঁয়া */}
      <path className="sk-steam sk-steam-1" d="M24 22c-3-4 3-6 0-10" />
      <path className="sk-steam sk-steam-2" d="M32 20c-3-4 3-6 0-10" />
      <path className="sk-steam sk-steam-3" d="M40 22c-3-4 3-6 0-10" />
      {/* কড়াই */}
      <g className="sk-pot">
        <path d="M10 30h44a2 2 0 0 1 2 2c0 11-10 20-24 20S8 43 8 32a2 2 0 0 1 2-2z" fill="#16a34a" />
        <path d="M14 34h36c-1.5 8-9 13.5-18 13.5S15.5 42 14 34z" fill="#22c55e" opacity=".45" />
        <rect x="2" y="31" width="8" height="4" rx="2" fill="#15803d" />
        <rect x="54" y="31" width="8" height="4" rx="2" fill="#15803d" />
      </g>
      {/* খাবারের দানা লাফাচ্ছে */}
      <circle className="sk-bit sk-bit-1" cx="26" cy="29" r="2.4" fill="#f97316" />
      <circle className="sk-bit sk-bit-2" cx="34" cy="28" r="2" fill="#facc15" />
      <circle className="sk-bit sk-bit-3" cx="40" cy="29" r="2.2" fill="#ef4444" />
    </svg>
  );

  if (inline) {
    return (
      <span role="status" className={`inline-flex items-center gap-2 text-sm text-stone-500 ${className}`}>
        {pot}
        {label && <span>{label}</span>}
      </span>
    );
  }

  return (
    <div role="status" className={`flex flex-col items-center justify-center gap-2 py-10 text-stone-500 ${className}`}>
      {pot}
      {label && <p className="text-sm font-medium sk-label">{label}</p>}
    </div>
  );
}

// কার্ড-আকৃতির ঝিকমিকে প্লেসহোল্ডার — তালিকা লোড হওয়ার সময় লেআউট ঠিক রাখে
export function SkeletonCards({ count = 3, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 shadow-sm flex gap-3">
          <div className="sk-shimmer w-16 h-16 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <div className="sk-shimmer h-3.5 rounded w-2/3" />
            <div className="sk-shimmer h-3 rounded w-1/3" />
            <div className="sk-shimmer h-3 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
