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

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  className = '',
  alt = 'User Avatar',
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  const isKnownBroken = Boolean(
    !src ||
    src.trim() === '' ||
    src.includes('unsplash.com') ||
    src.includes('profile_avatar_e77eul') ||
    src.includes('404')
  );

  const showFallback = isKnownBroken || imgError;
  const baseSize = sizeClasses[size] || sizeClasses.md;
  const initial = (name || alt || '?').trim()[0]?.toUpperCase() || '👤';

  if (showFallback) {
    return (
      <div
        className={`${baseSize} rounded-full bg-gradient-to-tr from-afzal via-amrin to-heart text-white font-black flex items-center justify-center shrink-0 shadow-md ${className}`}
        aria-label={alt || name || 'User Avatar'}
      >
        <span>{initial}</span>
      </div>
    );
  }

  return (
    <img
      src={src!}
      alt={alt || name || 'User'}
      onError={() => setImgError(true)}
      className={`${baseSize} rounded-full object-cover shrink-0 ${className}`}
    />
  );
};
