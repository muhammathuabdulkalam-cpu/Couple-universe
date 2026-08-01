import React from 'react';
import { Footer } from './Footer.js';
import { Navbar } from './Navbar.js';
import { ToastContainer } from './ToastContainer.js';

interface RootLayoutProps {
  children: React.ReactNode;
}

export const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  return (
    <div className="relative min-h-screen flex flex-col bg-obsidian-950 text-slate-100 overflow-hidden">
      
      {/* Background Ambient Glow Elements */}
      <div className="pointer-events-none absolute top-0 left-1/4 w-[500px] h-[500px] bg-afzal/15 rounded-full blur-[140px] animate-pulse-glow" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-amrin/15 rounded-full blur-[140px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      <div className="pointer-events-none absolute bottom-10 left-1/3 w-[400px] h-[400px] bg-heart/10 rounded-full blur-[120px]" />

      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
        {children}
      </main>

      <Footer />

      <ToastContainer />
    </div>
  );
};
