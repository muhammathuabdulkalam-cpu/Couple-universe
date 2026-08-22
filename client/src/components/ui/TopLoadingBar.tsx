import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const TopLoadingBar: React.FC = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setLoading(true);
    setProgress(30);

    const timer1 = setTimeout(() => setProgress(70), 100);
    const timer2 = setTimeout(() => setProgress(100), 250);
    const timer3 = setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [location.pathname]);

  if (!loading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 w-full pointer-events-none overflow-hidden bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-afzal via-amrin to-heart transition-all duration-300 ease-out shadow-[0_0_12px_rgba(139,92,246,0.8)]"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
};
