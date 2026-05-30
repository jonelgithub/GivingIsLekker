import { Request, Response, NextFunction } from 'express';

/**
 * Utility to scrub sensitive data from objects for secure logging.
 */
const scrubSensitiveData = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const scrubbed = { ...obj };
  const sensitiveKeys = ['client_secret', 'client_id', 'api_key', 'accountNumber', 'password', 'token', 'access_token'];

  for (const key of Object.keys(scrubbed)) {
    if (sensitiveKeys.some(sensitiveKey => key.toLowerCase().includes(sensitiveKey))) {
      scrubbed[key] = '********';
    } else if (typeof scrubbed[key] === 'object') {
      scrubbed[key] = scrubSensitiveData(scrubbed[key]);
    }
  }
  return scrubbed;
};

/**
 * Logger middleware that writes structured logs to the console,
 * omitting sensitive credential details.
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, originalUrl, ip } = req;
  
  // Log request arrival
  console.log(`[${new Date().toISOString()}] REQUEST: ${method} ${originalUrl} from ${ip}`);
  if (Object.keys(req.body).length > 0) {
    const safeBody = scrubSensitiveData(req.body);
    console.log(`  Payload:`, JSON.stringify(safeBody));
  }

  // Hook into response completion
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const statusLabel = statusCode >= 400 ? 'ERROR' : statusCode >= 300 ? 'WARN' : 'SUCCESS';
    console.log(`[${new Date().toISOString()}] RESPONSE: ${statusLabel} ${method} ${originalUrl} - Status: ${statusCode} - Time: ${duration}ms`);
  });

  next();
};
