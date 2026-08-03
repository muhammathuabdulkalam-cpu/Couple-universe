import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createCalculatorEngine } from './CalculatorEngine.js';
import './CalculatorLock.css';

interface CalculatorLockProps {
  token: string;
  onUnlock: () => void;
}

interface RippleState {
  id: number;
  x: number;
  y: number;
  size: number;
}

export const CalculatorLock: React.FC<CalculatorLockProps> = ({ token, onUnlock }) => {
  const engineRef = useRef(createCalculatorEngine());
  const [display, setDisplay] = useState('0');
  const [history, setHistory] = useState('');
  const [isFading, setIsFading] = useState(false);
  const [ripples, setRipples] = useState<Map<string, RippleState>>(new Map());
  const rippleIdRef = useRef(0);

  // Set document title to "Calculator"
  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'Calculator';

    // Hide any app-specific meta
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    const prevTheme = metaTheme?.getAttribute('content');
    metaTheme?.setAttribute('content', '#000000');

    return () => {
      document.title = prevTitle;
      if (prevTheme && metaTheme) {
        metaTheme.setAttribute('content', prevTheme);
      }
    };
  }, []);

  const addRipple = useCallback((e: React.TouchEvent | React.MouseEvent, btnKey: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clientX = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const size = Math.max(rect.width, rect.height) * 2;
    const id = rippleIdRef.current++;

    setRipples((prev) => {
      const next = new Map(prev);
      next.set(btnKey + id, { id, x: clientX - rect.left - size / 2, y: clientY - rect.top - size / 2, size });
      return next;
    });

    setTimeout(() => {
      setRipples((prev) => {
        const next = new Map(prev);
        next.delete(btnKey + id);
        return next;
      });
    }, 500);
  }, []);

  const syncState = useCallback(() => {
    const state = engineRef.current.getState();
    setDisplay(state.display);
    setHistory(state.history);
  }, []);

  const handleUnlockCheck = useCallback(
    async (expressionUsed: string) => {
      if (!expressionUsed || expressionUsed.length < 3) return;

      try {
        const { attemptUnlock } = await import('./UnlockService.js');
        const unlocked = await attemptUnlock(token, expressionUsed);
        if (unlocked) {
          setIsFading(true);
          setTimeout(() => {
            onUnlock();
          }, 200);
        }
      } catch {
        // Silent — calculator continues normally
      }
    },
    [token, onUnlock]
  );

  const handleButton = useCallback(
    (type: string, value: string, e: React.TouchEvent | React.MouseEvent) => {
      addRipple(e, value);
      const engine = engineRef.current;

      switch (type) {
        case 'clear':
          engine.clear();
          break;
        case 'delete':
          engine.deleteLast();
          break;
        case 'bracket':
          engine.inputBracket();
          break;
        case 'percent':
          engine.inputPercentage();
          break;
        case 'operator':
          engine.inputOperator(value);
          break;
        case 'decimal':
          engine.inputDecimal();
          break;
        case 'equals': {
          const { expressionUsed } = engine.calculate();
          syncState();
          handleUnlockCheck(expressionUsed);
          return;
        }
        case 'digit':
          engine.inputDigit(value);
          break;
      }

      syncState();

      // Check unlock on raw input sequence (supports instant unlock when expression is completed)
      const currentRawSeq = engine.getRawSequence();
      if (currentRawSeq.length >= 3) {
        handleUnlockCheck(currentRawSeq);
      }
    },
    [addRipple, syncState, handleUnlockCheck]
  );

  const displaySizeClass = useMemo(() => {
    if (display.length > 12) return 'calc-result calc-result--xs';
    if (display.length > 8) return 'calc-result calc-result--small';
    return 'calc-result';
  }, [display]);

  const buttons = useMemo(
    () => [
      { label: 'C', type: 'clear', value: 'C', className: 'calc-btn calc-btn--fn' },
      { label: '( )', type: 'bracket', value: '()', className: 'calc-btn calc-btn--fn' },
      { label: '%', type: 'percent', value: '%', className: 'calc-btn calc-btn--fn' },
      { label: '÷', type: 'operator', value: '÷', className: 'calc-btn calc-btn--op' },
      { label: '7', type: 'digit', value: '7', className: 'calc-btn calc-btn--num' },
      { label: '8', type: 'digit', value: '8', className: 'calc-btn calc-btn--num' },
      { label: '9', type: 'digit', value: '9', className: 'calc-btn calc-btn--num' },
      { label: '×', type: 'operator', value: '×', className: 'calc-btn calc-btn--op' },
      { label: '4', type: 'digit', value: '4', className: 'calc-btn calc-btn--num' },
      { label: '5', type: 'digit', value: '5', className: 'calc-btn calc-btn--num' },
      { label: '6', type: 'digit', value: '6', className: 'calc-btn calc-btn--num' },
      { label: '−', type: 'operator', value: '-', className: 'calc-btn calc-btn--op' },
      { label: '1', type: 'digit', value: '1', className: 'calc-btn calc-btn--num' },
      { label: '2', type: 'digit', value: '2', className: 'calc-btn calc-btn--num' },
      { label: '3', type: 'digit', value: '3', className: 'calc-btn calc-btn--num' },
      { label: '+', type: 'operator', value: '+', className: 'calc-btn calc-btn--op' },
      { label: '0', type: 'digit', value: '0', className: 'calc-btn calc-btn--num calc-btn--zero' },
      { label: '.', type: 'decimal', value: '.', className: 'calc-btn calc-btn--num' },
      { label: '=', type: 'equals', value: '=', className: 'calc-btn calc-btn--op' },
    ],
    []
  );

  return (
    <div className={`calc-container ${isFading ? 'calc-fade-out' : ''}`}>
      <div className="calc-statusbar" />

      <div className="calc-display">
        <div className="calc-history">{history}</div>
        <div className={displaySizeClass}>{display}</div>
      </div>

      <div className="calc-grid">
        {buttons.map((btn) => (
          <button
            key={btn.value + btn.type}
            className={btn.className}
            onClick={(e) => handleButton(btn.type, btn.value, e)}
            aria-label={btn.label}
          >
            {btn.label}
            {Array.from(ripples.entries())
              .filter(([key]) => key.startsWith(btn.value))
              .map(([key, ripple]) => (
                <span
                  key={key}
                  className="calc-ripple"
                  style={{
                    left: ripple.x,
                    top: ripple.y,
                    width: ripple.size,
                    height: ripple.size,
                  }}
                />
              ))}
          </button>
        ))}
      </div>
    </div>
  );
};
