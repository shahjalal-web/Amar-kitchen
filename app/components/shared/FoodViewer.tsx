'use client';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { FoodLike, foodImages } from '../../lib/foodImages';

const THUMB_SIZE = { sm: 'w-14 h-14', md: 'w-20 h-20 sm:w-24 sm:h-24', lg: 'w-24 h-24 sm:w-28 sm:h-28' } as const;
const THUMB_PX = { sm: '56px', md: '96px', lg: '112px' } as const;

// খাবারের ছোট ছবি — একাধিক ছবি থাকলে কোণায় সংখ্যা দেখায়
export function FoodThumb({ food, size = 'md', className = '', sizes }: { food: FoodLike; size?: keyof typeof THUMB_SIZE; className?: string; sizes?: string }) {
  const imgs = foodImages(food);
  return (
    <span className={`relative block overflow-hidden bg-stone-100 shrink-0 ${className || `${THUMB_SIZE[size]} rounded-xl`}`}>
      {imgs[0] ? (
        <Image src={imgs[0].url} alt={food.name} fill sizes={sizes ?? THUMB_PX[size]} className="object-cover" />
      ) : (
        <span className="absolute inset-0 grid place-items-center text-2xl">🍲</span>
      )}
      {imgs.length > 1 && (
        <span className="absolute bottom-1 right-1 text-[10px] font-semibold bg-black/60 text-white px-1.5 py-0.5 rounded-full">
          +{imgs.length - 1}
        </span>
      )}
    </span>
  );
}

// ছবি/নামে ক্লিক করলে বড় করে মডালে দেখায়। children = ক্লিকযোগ্য অংশ (না দিলে শুধু ছবি)।
export function FoodPreview({
  food, price, subtitle, footer, size = 'md', className = '', children,
}: {
  food: FoodLike;
  price?: number;
  subtitle?: ReactNode;
  footer?: ReactNode;      // মডালের নিচে (যেমন কার্টে যোগের বাটন)
  size?: keyof typeof THUMB_SIZE;
  className?: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded-xl ${className}`}
        aria-label={`${food.name} — বড় করে দেখুন`}
      >
        {children ?? <FoodThumb food={food} size={size} />}
      </button>
      {open && <FoodModal food={food} price={price} subtitle={subtitle} footer={footer} onClose={() => setOpen(false)} />}
    </>
  );
}

export function FoodModal({
  food, price, subtitle, footer, onClose,
}: {
  food: FoodLike;
  price?: number;
  subtitle?: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}) {
  const imgs = foodImages(food);
  const [index, setIndex] = useState(0);
  const track = useRef<HTMLDivElement>(null);

  const goTo = useCallback((i: number) => {
    const el = track.current;
    if (!el || !imgs.length) return;
    const next = (i + imgs.length) % imgs.length;
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
  }, [imgs.length]);

  // ESC বন্ধ করে, ← → ছবি বদলায়; মডাল খোলা থাকলে পেছনের পেজ স্ক্রল হয় না
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goTo(index + 1);
      if (e.key === 'ArrowLeft') goTo(index - 1);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [index, goTo, onClose]);

  const onScroll = () => {
    const el = track.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  const credit = imgs[index]?.credit;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="sk-backdrop absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={food.name}
        className="sk-sheet relative w-full sm:max-w-2xl max-h-[92dvh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl"
      >
        <div className="relative bg-stone-900">
          <div ref={track} onScroll={onScroll} className="sk-no-scrollbar flex overflow-x-auto snap-x snap-mandatory">
            {imgs.length ? imgs.map((img, i) => (
              <div key={img.url} className="relative shrink-0 w-full snap-center aspect-[4/3]">
                <Image src={img.url} alt={`${food.name} — ছবি ${i + 1}`} fill sizes="(max-width: 640px) 100vw, 672px" className="object-cover" priority={i === 0} />
              </div>
            )) : (
              <div className="w-full aspect-[4/3] grid place-items-center text-6xl">🍲</div>
            )}
          </div>

          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/55 hover:bg-black/75 text-white text-xl leading-none grid place-items-center"
            aria-label="বন্ধ করুন"
          >
            ×
          </button>

          {imgs.length > 1 && (
            <>
              <button onClick={() => goTo(index - 1)} className="hidden sm:grid absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-stone-800 text-xl place-items-center shadow" aria-label="আগের ছবি">‹</button>
              <button onClick={() => goTo(index + 1)} className="hidden sm:grid absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-stone-800 text-xl place-items-center shadow" aria-label="পরের ছবি">›</button>
              <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5">
                {imgs.map((img, i) => (
                  <button
                    key={img.url}
                    onClick={() => goTo(i)}
                    className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-2 bg-white/55'}`}
                    aria-label={`ছবি ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {imgs.length > 1 && (
          <div className="flex gap-2 px-4 pt-3 overflow-x-auto sk-no-scrollbar">
            {imgs.map((img, i) => (
              <button
                key={img.url}
                onClick={() => goTo(i)}
                className={`relative w-16 h-12 shrink-0 rounded-lg overflow-hidden ring-2 ${i === index ? 'ring-green-500' : 'ring-transparent opacity-70'}`}
                aria-label={`ছবি ${i + 1}`}
              >
                <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-stone-800">{food.name}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-sm">
                {food.category && <span className="bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full">{food.category}</span>}
                {food.source === 'kitchen' && <span className="bg-orange-100 text-orange-700 px-2.5 py-0.5 rounded-full">কিচেনের স্পেশাল</span>}
              </div>
              {subtitle && <div className="mt-2 text-sm text-stone-600">{subtitle}</div>}
            </div>
            {price !== undefined && <p className="text-2xl font-bold text-orange-600 shrink-0">৳{price}</p>}
          </div>
          {footer && <div className="mt-4">{footer}</div>}
          {credit && <p className="mt-4 text-[11px] leading-relaxed text-stone-400 break-words">{credit}</p>}
        </div>
      </div>
    </div>,
    document.body
  );
}
