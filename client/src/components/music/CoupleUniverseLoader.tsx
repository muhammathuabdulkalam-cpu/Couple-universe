import React from 'react';

interface CoupleUniverseLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CoupleUniverseLoader: React.FC<CoupleUniverseLoaderProps> = ({
  message = 'Loading...',
  size = 'md',
}) => {
  const logoSizeClass =
    size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-16 h-16' : 'w-12 h-12';
  const ringSizeClass =
    size === 'sm' ? 'w-10 h-10' : size === 'lg' ? 'w-20 h-20' : 'w-16 h-16';

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-6 select-none">
      {/* Animated Glowing Ring & Couple Universe Logo Container */}
      <div className={`relative flex items-center justify-center ${ringSizeClass}`}>
        {/* Outer Animated Spinning Gradient Ring */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 animate-spin blur-[2px] opacity-80" />

        {/* Pulse Glow Effect */}
        <div className="absolute inset-0 rounded-2xl bg-rose-500/30 animate-ping opacity-40" />

        {/* Center Logo Box */}
        <div className={`relative z-10 ${logoSizeClass} rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-slate-950 p-0.5`}>
          <img
            src="/logo.png"
            alt="Couple Universe Logo"
            className="w-full h-full object-cover rounded-xl"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      </div>

      {/* Loading Message Text */}
      {message && (
        <p className="text-xs font-bold text-slate-300 tracking-wide flex items-center gap-1.5 animate-pulse">
          <span>{message}</span>
        </p>
      )}
    </div>
  );
};
