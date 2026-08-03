/**
 * Pure TypeScript Calculator Engine
 * Handles all arithmetic operations with proper operator precedence.
 * Zero dependencies — standalone module.
 */

export interface CalculatorState {
  display: string;
  expression: string;
  history: string;
  hasResult: boolean;
}

const OPERATORS = ['+', '-', '×', '÷'];
const MAX_DISPLAY_LENGTH = 15;

const sanitizeExpression = (expr: string): string => {
  return expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/[^0-9+\-*/().%\s]/g, '');
};

const evaluateExpression = (expr: string): number => {
  const sanitized = sanitizeExpression(expr);
  if (!sanitized || sanitized.trim().length === 0) return 0;

  try {
    // Use Function constructor for safe evaluation (no access to scope)
    const fn = new Function(`"use strict"; return (${sanitized});`);
    const result = fn();
    if (typeof result !== 'number' || !isFinite(result)) return 0;
    return result;
  } catch {
    return NaN;
  }
};

const formatNumber = (num: number): string => {
  if (isNaN(num)) return 'Error';
  if (!isFinite(num)) return 'Error';

  const str = num.toString();
  if (str.length <= MAX_DISPLAY_LENGTH) {
    // Format with commas for integer part
    const parts = str.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  // Use scientific notation for very large numbers
  return num.toExponential(6);
};

export const createCalculatorEngine = () => {
  let state: CalculatorState = {
    display: '0',
    expression: '',
    history: '',
    hasResult: false,
  };

  // Track the raw input sequence for unlock detection
  let rawInputSequence = '';

  const getState = (): CalculatorState => ({ ...state });

  const getRawSequence = (): string => rawInputSequence;

  const resetRawSequence = (): void => {
    rawInputSequence = '';
  };

  const clear = (): void => {
    state = {
      display: '0',
      expression: '',
      history: '',
      hasResult: false,
    };
    rawInputSequence = '';
  };

  const deleteLast = (): void => {
    if (state.hasResult) {
      // After a result, delete starts fresh
      clear();
      return;
    }

    if (state.expression.length <= 1) {
      state.expression = '';
      state.display = '0';
    } else {
      state.expression = state.expression.slice(0, -1);
      state.display = state.expression || '0';
    }

    // Also trim from raw sequence
    if (rawInputSequence.length > 0) {
      rawInputSequence = rawInputSequence.slice(0, -1);
    }
  };

  const inputDigit = (digit: string): void => {
    if (state.hasResult) {
      // Start new expression after result
      state.expression = digit;
      state.display = digit;
      state.hasResult = false;
      rawInputSequence = digit;
      return;
    }

    // Prevent leading zeros (but allow "0.")
    if (state.expression === '0' && digit !== '.') {
      state.expression = digit;
    } else {
      state.expression += digit;
    }

    state.display = state.expression;
    rawInputSequence += digit;
  };

  const inputDecimal = (): void => {
    if (state.hasResult) {
      state.expression = '0.';
      state.display = '0.';
      state.hasResult = false;
      rawInputSequence = '0.';
      return;
    }

    // Find the current number segment (after last operator)
    const parts = state.expression.split(/[+\-×÷()]/);
    const currentSegment = parts[parts.length - 1] || '';

    if (currentSegment.includes('.')) return;

    if (state.expression === '' || state.expression === '0') {
      state.expression = '0.';
    } else {
      state.expression += '.';
    }

    state.display = state.expression;
    rawInputSequence += '.';
  };

  const inputOperator = (operator: string): void => {
    if (state.hasResult) {
      // Continue calculation from result
      state.expression = state.display.replace(/,/g, '');
      state.hasResult = false;
    }

    if (state.expression === '' || state.expression === '-') {
      if (operator === '-') {
        state.expression = '-';
        state.display = '-';
        rawInputSequence += '-';
      }
      return;
    }

    // Replace trailing operator
    const lastChar = state.expression.slice(-1);
    if (OPERATORS.includes(lastChar)) {
      state.expression = state.expression.slice(0, -1) + operator;
      rawInputSequence = rawInputSequence.slice(0, -1) + operator;
    } else {
      state.expression += operator;
      rawInputSequence += operator;
    }

    state.display = state.expression;
  };

  const inputBracket = (): void => {
    if (state.hasResult) {
      state.expression = '(';
      state.display = '(';
      state.hasResult = false;
      rawInputSequence = '(';
      return;
    }

    // Count open vs close brackets
    const openCount = (state.expression.match(/\(/g) || []).length;
    const closeCount = (state.expression.match(/\)/g) || []).length;

    const lastChar = state.expression.slice(-1);
    const shouldOpen =
      state.expression === '' ||
      state.expression === '0' ||
      OPERATORS.includes(lastChar) ||
      lastChar === '(';

    if (shouldOpen) {
      if (state.expression === '0') {
        state.expression = '(';
      } else {
        state.expression += '(';
      }
      rawInputSequence += '(';
    } else if (openCount > closeCount) {
      state.expression += ')';
      rawInputSequence += ')';
    }

    state.display = state.expression;
  };

  const inputPercentage = (): void => {
    if (state.expression === '' || state.expression === '0') return;

    try {
      const currentVal = evaluateExpression(state.expression);
      if (isNaN(currentVal)) return;

      const percentVal = currentVal / 100;
      state.expression = percentVal.toString();
      state.display = formatNumber(percentVal);
      state.hasResult = true;
      rawInputSequence += '%';
    } catch {
      // Silently fail
    }
  };

  const calculate = (): { result: string; expressionUsed: string } => {
    if (state.expression === '' || state.expression === '0') {
      return { result: '0', expressionUsed: '' };
    }

    // Capture the expression before calculation for unlock detection
    const capturedSequence = rawInputSequence;

    let expr = state.expression;

    // Auto-close unclosed brackets
    const openCount = (expr.match(/\(/g) || []).length;
    const closeCount = (expr.match(/\)/g) || []).length;
    for (let i = 0; i < openCount - closeCount; i++) {
      expr += ')';
    }

    // Remove trailing operators
    while (expr.length > 0 && OPERATORS.includes(expr.slice(-1))) {
      expr = expr.slice(0, -1);
    }

    if (expr === '') {
      return { result: '0', expressionUsed: '' };
    }

    const result = evaluateExpression(expr);
    const formatted = formatNumber(result);

    state.history = `${state.expression} =`;
    state.display = formatted;
    state.expression = isNaN(result) ? '' : result.toString();
    state.hasResult = true;

    // Reset raw sequence after calculation
    rawInputSequence = '';

    return { result: formatted, expressionUsed: capturedSequence };
  };

  return {
    getState,
    getRawSequence,
    resetRawSequence,
    clear,
    deleteLast,
    inputDigit,
    inputDecimal,
    inputOperator,
    inputBracket,
    inputPercentage,
    calculate,
  };
};

export type CalculatorEngine = ReturnType<typeof createCalculatorEngine>;
