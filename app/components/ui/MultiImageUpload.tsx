'use client';
import { useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { uploadImageToCloudinary } from '../../lib/cloudinary';
import { FoodImage } from '../../lib/foodImages';

interface Props {
  value: FoodImage[];
  onChange: (images: FoodImage[]) => void;
  folder?: string;
  label?: string;
  max?: number;
}

interface Pending { id: string; preview: string; progress: number }

// একসাথে একাধিক ছবি বাছাই ও আপলোড; প্রথম ছবি = প্রধান ছবি।
// এই ফর্মে নতুন আপলোড করা ছবি সেভের আগেই সরালে Cloudinary থেকেও মুছে ফেলা হয়।
// আগে সেভ করা ছবি সরালে সার্ভার সেভের সময় মুছে ফেলে।
export default function MultiImageUpload({ value, onChange, folder, label = 'ছবি', max = 6 }: Props) {
  const [pending, setPending] = useState<Pending[]>([]);
  const fresh = useRef(new Set<string>()); // এই সেশনে আপলোড হওয়া URL
  const latest = useRef(value); // একসাথে কয়েকটি আপলোড শেষ হলে সর্বশেষ তালিকায় যোগ করতে
  useEffect(() => { latest.current = value; }, [value]);
  const inputId = useId();

  const room = max - value.length - pending.length;

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith('image/'));
    e.target.value = '';
    if (!files.length) return;
    if (files.length > room) toast.error(`সর্বোচ্চ ${max}টি ছবি — প্রথম ${Math.max(room, 0)}টি নেওয়া হলো`);
    const chosen = files.slice(0, Math.max(room, 0));
    const tasks = chosen.map((file) => ({ file, id: `${Date.now()}-${Math.random()}`, preview: URL.createObjectURL(file) }));
    setPending((p) => [...p, ...tasks.map(({ id, preview }) => ({ id, preview, progress: 0 }))]);

    await Promise.all(tasks.map(async ({ file, id, preview }) => {
      try {
        const url = await uploadImageToCloudinary(file, folder, (progress) =>
          setPending((p) => p.map((x) => (x.id === id ? { ...x, progress } : x))));
        fresh.current.add(url);
        latest.current = [...latest.current, { url }];
        onChange(latest.current);
      } catch {
        toast.error(`${file.name} আপলোড ব্যর্থ হয়েছে`);
      } finally {
        URL.revokeObjectURL(preview);
        setPending((p) => p.filter((x) => x.id !== id));
      }
    }));
  };

  const remove = (url: string) => {
    onChange(value.filter((i) => i.url !== url));
    if (fresh.current.has(url)) {
      fresh.current.delete(url);
      api.post('/media/discard', { urls: [url] }).catch(() => undefined);
    }
  };

  const makeCover = (url: string) => {
    const img = value.find((i) => i.url === url);
    if (img) onChange([img, ...value.filter((i) => i.url !== url)]);
  };

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="block text-sm font-medium text-stone-700">{label}</label>
        <span className="text-xs text-stone-400">{value.length}/{max} · প্রথম ছবি প্রধান</span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {value.map((img, i) => (
          <div key={img.url} className="relative aspect-square rounded-xl overflow-hidden bg-stone-100 border border-stone-200 group">
            <Image src={img.url} alt={`ছবি ${i + 1}`} fill sizes="(max-width: 640px) 33vw, 160px" className="object-cover" />
            {i === 0 ? (
              <span className="absolute top-1.5 left-1.5 text-[10px] font-semibold bg-green-600 text-white px-1.5 py-0.5 rounded-full">প্রধান</span>
            ) : (
              <button type="button" onClick={() => makeCover(img.url)} className="absolute top-1.5 left-1.5 text-[10px] font-medium bg-white/90 text-stone-700 px-1.5 py-0.5 rounded-full">
                প্রধান করুন
              </button>
            )}
            <button
              type="button"
              onClick={() => remove(img.url)}
              className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 hover:bg-red-600 text-white text-base leading-none grid place-items-center"
              aria-label="ছবি সরান"
            >
              ×
            </button>
          </div>
        ))}

        {pending.map((p) => (
          <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.preview} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
            <div className="absolute inset-0 grid place-items-center">
              <span className="text-xs font-semibold text-orange-700 bg-white/90 px-2 py-0.5 rounded-full">{p.progress}%</span>
            </div>
            <div className="absolute bottom-0 inset-x-0 h-1 bg-stone-200">
              <div className="h-1 bg-orange-500 transition-all" style={{ width: `${p.progress}%` }} />
            </div>
          </div>
        ))}

        {room > 0 && (
          <label
            htmlFor={inputId}
            className="aspect-square rounded-xl border-2 border-dashed border-orange-300 bg-orange-50/60 hover:bg-orange-50 text-orange-600 cursor-pointer grid place-items-center text-center p-2"
          >
            <span>
              <span className="block text-2xl leading-none">📷</span>
              <span className="block text-xs font-medium mt-1">ছবি যোগ করুন</span>
              <span className="block text-[10px] text-orange-500/80">একসাথে কয়েকটি বাছা যায়</span>
            </span>
          </label>
        )}
      </div>
      <input id={inputId} type="file" accept="image/*" multiple onChange={pick} className="hidden" />
    </div>
  );
}

// ফর্ম বাতিল করলে: এই ফর্মে নতুন আপলোড হওয়া (আগে সেভ না থাকা) ছবিগুলো মুছে ফেলা।
// সার্ভার কোনো খাবারে ব্যবহৃত ছবি কখনো মোছে না, তাই এটা নিরাপদ।
export const discardUnsaved = (current: FoodImage[], original: FoodImage[] = []) => {
  const keep = new Set(original.map((i) => i.url));
  const urls = current.map((i) => i.url).filter((u) => !keep.has(u));
  if (urls.length) api.post('/media/discard', { urls }).catch(() => undefined);
};
