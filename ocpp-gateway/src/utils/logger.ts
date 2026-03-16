import winston from 'winston';

// Helper function to safely stringify objects with circular references
function safeStringify(obj: any): string {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    // Remove axios-specific circular references
    if (value && typeof value === 'object') {
      if (value.constructor && value.constructor.name === 'ClientRequest') {
        return '[ClientRequest]';
      }
      if (value.constructor && value.constructor.name === 'Socket') {
        return '[Socket]';
      }
    }
    return value;
  }, 2);
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'ocpp-gateway' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          // Extract error message and stack safely
          let metaString = '';
          if (Object.keys(meta).length) {
            try {
              // If meta contains an error object, extract useful info
              if (meta.error && meta.error instanceof Error) {
                const error = meta.error as any;
                const errorInfo: any = {
                  message: error.message,
                  stack: error.stack,
                };
                // Check if it's an axios error
                if (error.response) {
                  errorInfo.status = error.response.status;
                  errorInfo.statusText = error.response.statusText;
                  errorInfo.data = error.response.data;
                }
                metaString = safeStringify({ ...meta, error: errorInfo });
              } else {
                metaString = safeStringify(meta);
              }
            } catch (e) {
              metaString = `[Error stringifying metadata: ${e instanceof Error ? e.message : String(e)}]`;
            }
          }
          return `${timestamp} [${level}]: ${message} ${metaString}`;
        })
      )
    })
  ]
});



