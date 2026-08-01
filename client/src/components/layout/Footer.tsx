import { Heart, ShieldCheck } from 'lucide-react';
import React from 'react';

interface Props {
  className?: string;
}

export const Footer: React.FC<Props> = ({ className = '' }) => {
  return (
    <footer className={`w-full border-t border-white/5 bg-obsidian-950/80 backdrop-blur-lg py-8 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-afzal" />
          <span>Enterprise MERN Architecture • AES-256 Encrypted Private Vault</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>Crafted with</span>
          <Heart className="w-3.5 h-3.5 text-heart fill-heart" />
          <span>for</span>
          <span className="font-semibold text-slate-200">Afzal & Amrin</span>
          <span className="text-slate-500">• Together since March 26, 2026</span>
        </div>

      </div>
    </footer>
  );
};
