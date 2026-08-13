/**
 * WebViewGold chrome — no native rebuild required.
 * The shipped wrapper intercepts `hidebars://` / `statusbarcolor://` so the web
 * background can fill the time/signal strip.
 */

function hexToRgb(hex: string): [number, number, number] | null {
  const raw = hex.replace('#', '').trim();
  if (raw.length !== 6 || /[^0-9a-fA-F]/.test(raw)) return null;
  return [
    Number.parseInt(raw.slice(0, 2), 16),
    Number.parseInt(raw.slice(2, 4), 16),
    Number.parseInt(raw.slice(4, 6), 16),
  ];
}

function pingScheme(url: string): void {
  try {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText = 'display:none;width:0;height:0;border:0;position:absolute;left:-9999px';
    iframe.src = url;
    (document.body ?? document.documentElement).appendChild(iframe);
    window.setTimeout(() => iframe.remove(), 400);
  } catch {
    /* ignore */
  }
  try {
    const img = new Image();
    img.src = url;
  } catch {
    /* ignore */
  }
}

/** WKWebView (WebViewGold) vs iOS Safari — Safari defines `window.safari`. */
export function isLikelyNativeWebView(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  if (/WebViewGold/i.test(ua)) return true;
  if (/Android/i.test(ua) && /; wv\)/i.test(ua)) return true;
  const ios = /iPhone|iPad|iPod/i.test(ua);
  if (ios && typeof (window as Window & { safari?: unknown }).safari === 'undefined') return true;
  if (ios && /AppleWebKit/i.test(ua) && !/Safari/i.test(ua)) return true;
  return false;
}

function readSafeAreaTopPx(): number {
  if (typeof document === 'undefined' || !document.body) return 0;
  const probe = document.createElement('div');
  probe.style.cssText =
    'position:absolute;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top, 0px)';
  document.body.appendChild(probe);
  const px = Number.parseFloat(getComputedStyle(probe).paddingTop) || 0;
  probe.remove();
  return px;
}

function typicalIosStatusBarPx(): number {
  const h = window.screen?.height ?? 0;
  if (h >= 852) return 59;
  if (h >= 812) return 47;
  return 20;
}

function isEdgeToEdgeViewport(): boolean {
  const screenH = window.screen?.height ?? 0;
  if (!screenH) return false;
  const viewH = window.visualViewport?.height ?? window.innerHeight;
  return viewH >= screenH * 0.92;
}

export function applyAppSafeAreaTop(): void {
  if (typeof document === 'undefined') return;
  let sat = readSafeAreaTopPx();
  const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (ios && sat < 1 && isEdgeToEdgeViewport()) {
    sat = typicalIosStatusBarPx();
  }
  document.documentElement.style.setProperty('--app-sat', `${sat}px`);
}

let didMainFrameCommand = false;
let viewportBound = false;

/**
 * Make the native status-bar background transparent (web fill shows through),
 * paint it if the wrapper still draws a bar, then size `--app-sat` for the header.
 */
export function syncWebViewGoldStatusBar(hex: string): void {
  if (typeof window === 'undefined') return;

  pingScheme('hidebars://on');
  const rgb = hexToRgb(hex);
  if (rgb) {
    pingScheme(`statusbarcolor://${rgb.join(',')}`);
    pingScheme('statusbartextcolor://black');
    pingScheme(`WebViewGold://statusbar?color=${hex}`);
  }

  if (!didMainFrameCommand && isLikelyNativeWebView()) {
    didMainFrameCommand = true;
    try {
      window.location.href = 'hidebars://on';
    } catch {
      /* wrapper optional */
    }
    window.setTimeout(() => {
      if (rgb) {
        try {
          window.location.href = `statusbarcolor://${rgb.join(',')}`;
        } catch {
          /* wrapper optional */
        }
      }
      applyAppSafeAreaTop();
    }, 350);
  }

  applyAppSafeAreaTop();
  window.setTimeout(applyAppSafeAreaTop, 400);
  if (!viewportBound) {
    viewportBound = true;
    window.visualViewport?.addEventListener('resize', applyAppSafeAreaTop);
  }
}
