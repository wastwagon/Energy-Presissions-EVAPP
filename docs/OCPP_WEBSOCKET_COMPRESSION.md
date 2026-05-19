# OCPP WebSocket compression (RSV1 errors)

## Symptom

Super Admin → **Device Management** → **Recent Connection Errors**:

- **Error code:** `WEBSOCKET_ERROR`
- **Message:** `Invalid WebSocket frame: RSV1 must be clear`
- **Charge point:** e.g. `0900330710111935`

The device **is** reaching the server; the WebSocket handshake often succeeds, then frames fail because the charger sends **compressed** WebSocket data while the server did not negotiate `permessage-deflate`.

## Server fix (required)

The CSMS enables **per-message deflate** on the OCPP `WebSocketServer` (`backend/src/ocpp/ocpp-websocket-options.ts`). Deploy the API and restart the container after merging this change.

Nginx: `gzip off` on `location /ocpp` so HTTP gzip is not applied to the upgrade path.

## Disabling compression on the charger

Many **DY / embedded OCPP** units do **not** expose a “WebSocket compression” toggle. If your web UI has no such option, rely on the server fix above.

If your vendor UI includes OCPP advanced settings, look for any of:

- WebSocket compression
- permessage-deflate
- Data compression (OCPP transport)

Set them to **Off** / **Disabled**, then reboot the charger.

**Do not** change the server URL format:

```text
wss://cleanmotion.energyprecisions.com/ocpp/0900330710111935
```

Use the full serial in the path (no trailing slash after the ID).

## Verify after deploy

1. Clear old errors in the portal (optional).
2. Reboot the charge point or wait for reconnect.
3. Check logs:

   ```bash
   docker logs -f ev-billing-api 2>&1 | grep -iE "0900330710111935|BootNotification|RSV1"
   ```

4. Expect: `New WebSocket connection` → `BootNotification accepted` → no new `RSV1` errors.

## CDN / proxy

If traffic passes through **Cloudflare** or another CDN, enable **WebSockets** and avoid response compression rules on `/ocpp/*`.
