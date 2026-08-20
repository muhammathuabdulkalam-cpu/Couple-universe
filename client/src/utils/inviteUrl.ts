/**
 * Utility to generate public invitation URLs for remote/multi-location users
 */
export const getPublicAppOrigin = (): string => {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    // If running on local dev (localhost, 127.0.0.1, or local LAN IP like 192.168.x.x),
    // default to the hosted Vercel production URL so shared invite links work for users anywhere in the world!
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('192.168.')) {
      return 'https://afrin-verse-web.vercel.app';
    }
    return origin;
  }
  return 'https://afrin-verse-web.vercel.app';
};

export const buildInviteUrl = (tokenCode: string): string => {
  const origin = getPublicAppOrigin();
  return `${origin}/invite/${encodeURIComponent(tokenCode)}`;
};
