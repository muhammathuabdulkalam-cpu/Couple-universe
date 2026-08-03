import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CalculatorLock } from '../../components/stealth/CalculatorLock.js';
import { useStealthStore } from '../../store/stealthStore.js';

export const StealthEntryPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const {
    validateToken,
    setUnlocked,
    setStealthToken,
    isValidating,
  } = useStealthStore();

  const [hasValidated, setHasValidated] = useState(false);

  // Validate the stealth token on mount
  useEffect(() => {
    if (!token || hasValidated) return;

    const run = async () => {
      setStealthToken(token);
      await validateToken(token);
      setHasValidated(true);
    };

    run();
  }, [token, hasValidated, validateToken, setStealthToken]);

  const handleUnlock = useCallback(() => {
    setUnlocked();
    // Navigate directly into application dashboard without typing any login credentials
    navigate('/dashboard', { replace: true });
  }, [setUnlocked, navigate]);

  // Show dark screen briefly while token is validating
  if (!hasValidated || isValidating) {
    return <div style={{ background: '#000', position: 'fixed', inset: 0, zIndex: 99999 }} />;
  }

  // Render Calculator Lock Screen directly whenever the private link is opened or refreshed
  return <CalculatorLock token={token!} onUnlock={handleUnlock} />;
};
