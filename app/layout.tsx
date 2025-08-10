// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Wendy Davis Style',
  description: 'Personal styling by Wendy Davis – wardrobe, editorial, and event styling.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* Body inherits Cormorant Garamond from globals.css */}
      <body className="min-h-screen bg-[#f0faf7] flex flex-col">
        <header className="glass py-3 sm:py-4 px-4 sm:px-5 flex flex-col sm:flex-row justify-between items-center mx-2 sm:mx-4">
          <div className="flex items-center space-x-3">
            <Image
              src="/wendy_logo.png"
              alt="Wendy Davis Logo"
              width={50}
              height={50}
              className="h-12 w-auto object-contain"
              priority
            />
            <h2 className="font-allura text-4xl sm:text-5xl leading-tight">Wendy Davis Style</h2>
          </div>
        </header>

        <main className="flex-1 flex flex-col">{children}</main>

        <footer className="glass bg-[#e6f5f4] py-2 px-[10px] mx-2 sm:mx-4 flex items-center justify-between">
          {/* Logo on the far left */}
          <Image
            src="/wendy_logo1.png"
            alt="Wendy Davis Logo"
            width={40}
            height={40}
            className="h-10 w-auto object-contain"
            priority
          />

          {/* Footer text */}
          <p className="text-center flex-1">&copy; 2025 Wendy Davis Style. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}
