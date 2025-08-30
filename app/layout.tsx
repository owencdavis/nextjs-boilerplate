// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Wendy Davis Style',
  description: 'Personal styling by Wendy Davis – wardrobe, editorial, and event styling.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-dvh bg-[#f0faf7] flex flex-col">
        <header className="glass shrink-0 py-3 sm:py-4 px-4 sm:px-5 flex flex-col sm:flex-row justify-between items-center mx-2 sm:mx-4">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-90 transition">
            <Image
              src="/wendy_logo.png"
              alt="Wendy Davis Logo"
              width={50}
              height={50}
              className="h-12 w-auto object-contain"
              priority
            />
            <h2 className="font-allura text-4xl sm:text-5xl leading-tight">
              Wendy Davis Style
            </h2>
          </Link>
          <nav className="flex items-center gap-6">
            <a href="/smartstyle" className="text-sm hover:opacity-80">SmartStyle</a>
          </nav>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto flex flex-col">
          {children}
        </main>

        <footer className="glass shrink-0 bg-[#e6f5f4] py-2 px-[10px] mx-2 sm:mx-4 flex items-center justify-between">
          <Link href="/" className="hover:opacity-90 transition">
            <Image
              src="/wendy_logo1.png"
              alt="Wendy Davis Logo"
              width={40}
              height={40}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>
          <p className="text-center flex-1">&copy; 2025 Wendy Davis Style. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}
