import './globals.css';
import Header from '@/components/Header';
import React from 'react';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'Voyager',
  description: 'Track places to visit',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 font-sans [font-family:var(--font-inter)]">
        <Header />
        <main className="mx-auto max-w-6xl p-4 md:p-6 lg:p-8">{children}</main>
      </body>
    </html>
  );
}
