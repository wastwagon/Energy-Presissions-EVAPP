import type { ServerOptions } from 'ws';

/** See backend/src/ocpp/ocpp-websocket-options.ts — keep in sync. */
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
