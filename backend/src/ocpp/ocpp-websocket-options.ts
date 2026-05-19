import type { ServerOptions } from 'ws';

/**
 * Some OCPP charge points (e.g. DY firmware) send WebSocket frames with RSV1 set
 * (per-message compression) without a matching server extension, which makes
 * Node `ws` throw: "Invalid WebSocket frame: RSV1 must be clear".
 *
 * Enabling `perMessageDeflate` negotiates compression in the handshake so RSV1
 * is valid. Chargers that do not use compression are unaffected.
 */
export const OCPP_WEBSOCKET_SERVER_OPTIONS: Pick<ServerOptions, 'perMessageDeflate'> = {
  perMessageDeflate: {
    zlibDeflateOptions: { chunkSize: 1024, memLevel: 7, level: 3 },
    zlibInflateOptions: { chunkSize: 10 * 1024 },
    clientNoContextTakeover: true,
    serverNoContextTakeover: true,
    serverMaxWindowBits: 10,
    concurrencyLimit: 10,
    threshold: 256,
  },
};
