// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';

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
          {/* Allura title — larger for readability */}
          <h1 className="font-allura text-4xl sm:text-5xl leading-tight">Wendy Davis Style</h1>
        </header>

        <main className="flex-1 flex flex-col">{children}</main>

        <footer className="glass bg-[#e6f5f4] text-center py-6 mx-2 sm:mx-4">
          <p>&copy; 2025 Wendy Davis Stylist. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}
