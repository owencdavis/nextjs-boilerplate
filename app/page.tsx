'use client';

import { useState } from 'react';
import Image from 'next/image';

// Tab options
const TABS = ['home', 'about', 'gallery'] as const;

export default function Home() {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('home');

  const renderContent = () => {
    switch (activeTab) {
      case 'about':
        return (
          <>
            <h2 className="text-center text-xl sm:text-2xl mb-4">About Me</h2>
            <section className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="md:col-span-2 flex justify-center">
                <Image
                  src="/wendy.jpeg"
                  alt="Wendy Davis, Personal Stylist"
                  width={768}
                  height={1152}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 45vw, 40vw"
                  className="rounded-2xl shadow-lg object-cover w-full h-auto max-w-md"
                  priority
                />
              </div>
              <div className="md:col-span-3 space-y-3">
                <p className="text-sm sm:text-base leading-relaxed">
                  Welcome! I’m Wendy Davis, a personal stylist with over 15 years of experience
                  helping individuals discover their best selves through fashion. I specialize in
                  wardrobe curation, closet edits, and personalized styling sessions tailored to each
                  client’s unique lifestyle.
                </p>
                <p className="text-sm sm:text-base leading-relaxed">
                  My approach centers on fit, fabric, and texture—curating looks that feel effortless,
                  elevated, and uniquely you. Whether you need a seasonal refresh, on-call styling for
                  events, or support for editorial and commercial shoots, I bring a calm, detail-driven
                  eye to every project.
                </p>
              </div>
            </section>
          </>
        );
      case 'gallery':
        return (
          <>
            <h2 className="text-center text-xl sm:text-2xl mb-4">Gallery</h2>
            <p className="text-sm sm:text-base">
              Coming soon: A showcase of my past work, editorial styling, and behind-the-scenes shots from recent shoots.
            </p>
          </>
        );
      case 'home':
        return (
          <>
            <h2 className="text-center text-xl sm:text-2xl mb-4">Home</h2>
            <p className="text-sm sm:text-base leading-relaxed">
              I offer a range of personalized styling services including wardrobe curation, closet
              edits, event styling, and on-set support for editorial or commercial projects. Whether
              you need a seasonal refresh or full wardrobe transformation, I ensure every detail feels
              tailored to your unique style and lifestyle.
            </p>

            {/* Logo at the bottom of Home content */}
            <div className="mt-8 flex justify-center">
              <Image
                src="/wendy_logo1.png"
                alt="Wendy Davis Logo"
                width={300}
                height={300}
                className="opacity-90"
                priority
              />
            </div>
          </>
        );
    }
  };

  return (
    <>
      {/* Navigation */}
      <nav className="button-container flex flex-wrap justify-center gap-2 sm:gap-4 mb-2 px-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`liquid-button px-3 py-1 sm:px-5 sm:py-2 ${
              activeTab === tab ? 'border-white text-white' : ''
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="dynamic-content glass max-w-full sm:max-w-3xl mx-2 sm:mx-auto mt-2 mb-[40px] px-8 pt-4 pb-12 bg-[#D0F0F4] border-2 border-[#0AABAC] rounded-2xl shadow-lg flex-grow">
        {renderContent()}
      </main>
    </>
  );
}
