# WebViewGold haptics (optional)

The web app calls `triggerHaptic()` from `frontend/src/utils/haptics.ts` on taps (lists, refresh, FAQ, bottom nav, etc.). In a plain mobile browser this may fall back to a short `navigator.vibrate` where supported.

For **native-feel feedback in WebViewGold**, wire one of these in your iOS wrapper:

1. **`window.HapticFeedback.impact('light' | 'medium')`** — if your WebViewGold custom JS API exposes it.
2. **`window.webkit.messageHandlers.haptic.postMessage({ style: 'light' })`** — register a handler named `haptic` in the native shell.

No frontend change is required once the bridge exists; reload the WebView after updating native config.

**Quick test:** open Help FAQ or bottom nav in the wrapped app and confirm a light tap sensation. If silent, the bridge is not connected yet.
