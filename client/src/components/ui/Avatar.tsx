import { UserCircle2 } from 'lucide-react';
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

const iconSizeClasses = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-7 h-7',
  xl: 'w-9 h-9',
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

  const showIcon = isKnownBroken || imgError;

  const baseSize = sizeClasses[size] || sizeClasses.md;
  const iconSize = iconSizeClasses[size] || iconSizeClasses.md;

  if (showIcon) {
    return (
      <div
        className={`${baseSize} rounded-full bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border border-white/10 flex items-center justify-center shrink-0 ${className}`}
        aria-label={alt}
      >
        <UserCircle2 className={`${iconSize} text-slate-400`} />
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
