// next/image লোডার: Cloudinary নিজেই ছবি ছোট করে, WebP/AVIF বানিয়ে CDN থেকে দেয়।
// এতে Vercel-এর ইমেজ অপটিমাইজেশন কোটা লাগে না, আর মোবাইলে ছোট ফাইল আসে।
export default function cloudinaryLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  if (src.includes('res.cloudinary.com') && src.includes('/image/upload/')) {
    return src.replace('/image/upload/', `/image/upload/f_auto,q_${quality ?? 'auto'},w_${width},c_limit/`);
  }
  return `${src}${src.includes('?') ? '&' : '?'}w=${width}`;
}
