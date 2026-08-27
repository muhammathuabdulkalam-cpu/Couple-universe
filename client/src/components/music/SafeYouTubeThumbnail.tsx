import React, { useState, useEffect } from 'react';

interface SafeYouTubeThumbnailProps {
  videoId: string;
  customUrl?: string;
  alt: string;
  className?: string;
}

// Build a reliable ordered list of thumbnail URLs to try.
// sddefault (480×360) is the most universally available format.
// We skip maxresdefault/hqdefault first to avoid console 404 noise
// when those qualities aren't available for a video.
function buildSources(videoId: string, customUrl?: string): string[] {
  const id = videoId || 'kJQP7kiw5Fk';
  const yt = (quality: string) => `https://i.ytimg.com/vi/${id}/${quality}.jpg`;

  const sources: string[] = [];

  // 1. Custom URL provided by the caller (e.g. from YouTube API response)
  if (customUrl && !customUrl.includes('hqdefault')) {
    sources.push(customUrl);
  }

  // 2. sddefault — most reliable, available for almost all videos
  sources.push(yt('sddefault'));
  // 3. mqdefault — medium quality, nearly universal
  sources.push(yt('mqdefault'));
  // 4. hqdefault — HD quality (may 404 on restricted/deleted videos)
  sources.push(yt('hqdefault'));
  // 5. default (120×90) — lowest quality but nearly always present
  sources.push(yt('default'));
  // 6. Frame 0 grab — last resort YouTube fallback
  sources.push(yt('0'));
  // 7. Static music art fallback (Unsplash) — absolute last resort
  sources.push('https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=640&q=80');

  return sources;
}

export const SafeYouTubeThumbnail: React.FC<SafeYouTubeThumbnailProps> = ({
  videoId,
  customUrl,
  alt,
  className = '',
}) => {
  const [sources, setSources] = useState<string[]>(() => buildSources(videoId, customUrl));
  const [currentIdx, setCurrentIdx] = useState(0);

  // Reset when videoId changes
  useEffect(() => {
    setSources(buildSources(videoId, customUrl));
    setCurrentIdx(0);
  }, [videoId, customUrl]);

  const currentSrc = sources[currentIdx] ?? sources[sources.length - 1];

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={() => {
        setCurrentIdx((prev) => {
          const next = prev + 1;
          return next < sources.length ? next : prev;
        });
      }}
    />
  );
};
