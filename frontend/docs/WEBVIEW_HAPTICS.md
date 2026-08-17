# WebViewGold haptics

The web app calls `triggerHaptic()` from `frontend/src/utils/haptics.ts` on taps (lists, refresh, FAQ, bottom nav, etc.).

Order of attempts:

1. `window.HapticFeedback.impact('light' | 'medium')` / `.notification(...)` if the wrapper injects it.
2. `window.webkit.messageHandlers.haptic` or `hapticFeedback` `postMessage({ style })`.
3. URL-scheme image pings (no native rebuild if the wrapper already intercepts custom schemes):
   - `haptic://light` · `haptic://medium` · `haptic://success`
   - `hapticfeedback://impactlight` · `impactmedium` · `notificationsuccess`
4. `navigator.vibrate` on Android / browsers that allow it.

**Wrapper config:** add those `haptic://` and `hapticfeedback://` prefixes to WebViewGold custom URL schemes and map them to a light impact. iOS Safari will ignore unknown schemes.

**Quick test:** open Help FAQ or the bottom tab bar in the wrapped app and confirm a light tap. If silent, the schemes are not registered yet.
