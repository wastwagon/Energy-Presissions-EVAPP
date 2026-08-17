import { isLikelyNativeWebView } from './webviewGold';

/**
 * Light haptic feedback for WebViewGold / mobile browsers.
 * Tries native bridges first, then URL-scheme pings (same pattern as hidebars://), then vibrate.
 */
export type HapticStyle = 'light' | 'medium' | 'success' | 'warning' | 'error';

declare global {
  interface Window {
    /** Optional WebViewGold / native bridge */
    HapticFeedback?: { impact?: (style: string) => void; notification?: (type: string) => void };
    webkit?: { messageHandlers?: Record<string, { postMessage: (body: unknown) => void }> };
  }
}

function hapticSchemeName(style: HapticStyle): string {
  if (style === 'medium') return 'medium';
  if (style === 'success' || style === 'warning' || style === 'error') return style;
  return 'light';
}

function hapticFeedbackSchemeName(style: HapticStyle): string {
  if (style === 'medium') return 'impactmedium';
  if (style === 'success') return 'notificationsuccess';
  if (style === 'warning') return 'notificationwarning';
  if (style === 'error') return 'notificationerror';
  return 'impactlight';
}

/** Image ping only — iframe churn on every list tap would jank the WebView. */
function pingHapticScheme(url: string): void {
  try {
    const img = new Image();
    img.src = url;
  } catch {
    /* wrapper optional */
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

    const handlers = window.webkit?.messageHandlers;
    const hapticHandler = handlers?.haptic ?? handlers?.hapticFeedback;
    if (hapticHandler) {
      hapticHandler.postMessage({ style });
      return;
    }

    if (isLikelyNativeWebView()) {
      pingHapticScheme(`haptic://${hapticSchemeName(style)}`);
      pingHapticScheme(`hapticfeedback://${hapticFeedbackSchemeName(style)}`);
    }

    if (navigator.vibrate) {
      const ms = style === 'light' ? 8 : style === 'medium' ? 14 : 20;
      navigator.vibrate(ms);
    }
  } catch {
    /* native bridge optional */
  }
}
