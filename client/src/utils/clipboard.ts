/**
 * Robust clipboard copy helper with fallback for non-secure HTTP contexts / webviews
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (!text) return false;

  // Try modern navigator.clipboard API
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_err) {
    // Fallback below
  }

  // Fallback for HTTP / non-secure origin / legacy mobile browsers
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    // Keep off screen
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (_err) {
    return false;
  }
};
