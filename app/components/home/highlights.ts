import type { FoodLike } from '../../lib/foodImages';

export interface Highlights {
  foods: (FoodLike & { _id: string })[];
  stats: { kitchens: number; areas: number; cities: number; delivered: number };
}

// সার্ভারে চলে (ISR): ব্যাকএন্ড বন্ধ থাকলে বা বিল্ডের সময় না পেলে null — পেজ তবুও দেখায়
export async function getHighlights(revalidate: number): Promise<Highlights | null> {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) return null;
  try {
    const res = await fetch(`${base}/kitchen/public/highlights`, {
      next: { revalidate },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return (await res.json()).data as Highlights;
  } catch {
    return null;
  }
}
