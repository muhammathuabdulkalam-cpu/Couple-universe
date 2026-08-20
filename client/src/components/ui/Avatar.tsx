import React, { useState, useEffect } from 'react';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alt?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
};

const DEFAULT_AFZAL_AVATAR = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80';
const DEFAULT_AMRIN_AVATAR = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80';

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  className = '',
  alt = 'User Avatar',
}) => {
  const [imgErrorCount, setImgErrorCount] = useState(0);

  useEffect(() => {
    setImgErrorCount(0);
  }, [src]);

  const displayName = name || 'User';
  const isAmrin = displayName.toLowerCase().includes('amrin') || displayName.toLowerCase().includes('co-owner');
  const defaultAvatarUrl = isAmrin ? DEFAULT_AMRIN_AVATAR : DEFAULT_AFZAL_AVATAR;

  const isKnownBroken = Boolean(
    !src ||
    src.trim() === '' ||
    src.includes('profile_avatar_e77eul') ||
    src.includes('404')
  );

  let currentSrc = (!isKnownBroken && imgErrorCount === 0) ? src! : defaultAvatarUrl;

  const baseSize = sizeClasses[size] || sizeClasses.md;

  return (
    <img
      src={currentSrc}
      alt={alt || displayName}
      onError={() => {
        if (imgErrorCount < 2) {
          setImgErrorCount((prev) => prev + 1);
        }
      }}
      className={`${baseSize} rounded-full object-cover shrink-0 ${className}`}
    />
  );
};
