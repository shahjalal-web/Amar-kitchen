import type { Metadata } from 'next';
import { Noto_Sans_Bengali } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import AuthProvider from './components/shared/AuthProvider';
import Navbar from './components/Navbar';

const banglaFont = Noto_Sans_Bengali({
  subsets: ['bengali'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-bangla',
});

// লিংক শেয়ারের ছবির (opengraph-image.jpg) পুরো URL বানাতে লাগে।
// লাইভে NEXT_PUBLIC_SITE_URL দিন; না দিলে Vercel-এর প্রোডাকশন ডোমেইন, তাও না থাকলে localhost
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

const DESCRIPTION = 'পাশের বাসার গৃহিণীর যত্নে রাঁধা গরম খাবার — সাশ্রয়ে, পৌঁছে যায় আপনার দরজায়।';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'শখের কিচেন — মায়ের হাতের স্বাদ, এখন পাড়াতেই',
  description: DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: 'শখের কিচেন',
    locale: 'bn_BD',
    title: 'শখের কিচেন — মায়ের হাতের স্বাদ, এখন পাড়াতেই',
    description: DESCRIPTION,
  },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" className={banglaFont.variable}>
      <body className="min-h-screen bg-green-50 font-bangla">
        <AuthProvider>
          <Navbar />
          {children}
          <Toaster position="top-center" />
        </AuthProvider>
      </body>
    </html>
  );
}
