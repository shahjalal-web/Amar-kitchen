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

export const metadata: Metadata = {
  title: 'আমার কিচেন',
  description: 'ঘরের রান্না, দোরগোড়ায় পৌঁছে দেওয়া',
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
