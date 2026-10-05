import HomeClient from './components/home/HomeClient';
import { getHighlights } from './components/home/highlights';

// ISR: পেজটি আগে থেকে তৈরি (স্ট্যাটিক) থাকে, ১০ মিনিট পরপর পেছনে নতুন ডেটা দিয়ে আবার তৈরি হয় —
// ভিজিটরকে কখনো লোডিং দেখতে হয় না
export const revalidate = 600;

export default async function HomePage() {
  const highlights = await getHighlights(revalidate);
  return <HomeClient highlights={highlights} />;
}
