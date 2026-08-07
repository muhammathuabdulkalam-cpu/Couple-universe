import React from 'react';

interface MusicWaveformProps {
  isPlaying: boolean;
  barCount?: number;
  height?: number;
  color?: string;
}

export const MusicWaveform: React.FC<MusicWaveformProps> = React.memo(({
  isPlaying,
  barCount = 16,
  height = 24,
  color = 'bg-rose-500',
}) => {
  return (
    <div className="flex items-end gap-1 px-1" style={{ height: `${height}px` }}>
      {[...Array(barCount)].map((_, i) => {
        const delay = (i % 5) * 0.15;
        const barHeightPercent = isPlaying ? 30 + ((i * 17) % 70) : 15;

        return (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-300 ${color}`}
            style={{
              height: isPlaying ? `${barHeightPercent}%` : '15%',
              animation: isPlaying ? `pulse 0.8s ease-in-out infinite alternate` : 'none',
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
    </div>
  );
});
