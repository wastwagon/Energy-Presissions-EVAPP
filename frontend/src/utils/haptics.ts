/**
 * Light haptic feedback for WebViewGold / mobile browsers.
 * WebViewGold may expose `window.webkit.messageHandlers` or custom JS bridges — extend as needed.
 */
export type HapticStyle = 'light' | 'medium' | 'success' | 'warning' | 'error';

declare global {
  interface Window {
    /** Optional WebViewGold / native bridge */
    HapticFeedback?: { impact?: (style: string) => void; notification?: (type: string) => void };
    webkit?: { messageHandlers?: Record<string, { postMessage: (body: unknown) => void }> };
  }
}

export function triggerHaptic(style: HapticStyle = 'light'): void {
  try {
    if (typeof window === 'undefined') return;

    if (window.HapticFeedback?.impact) {
      window.HapticFeedback.impact(style === 'light' ? 'light' : 'medium');
      return;
    }
    if (window.HapticFeedback?.notification && style !== 'light' && style !== 'medium') {
      window.HapticFeedback.notification(style);
      return;
    }

    const hapticHandler = window.webkit?.messageHandlers?.haptic;
    if (hapticHandler) {
      hapticHandler.postMessage({ style });
      return;
    }

    if (navigator.vibrate) {
      const ms = style === 'light' ? 8 : style === 'medium' ? 14 : 20;
      navigator.vibrate(ms);
    }
  } catch {
    /* native bridge optional */
  }
}
