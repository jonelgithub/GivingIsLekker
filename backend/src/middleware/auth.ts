import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

/**
 * Middleware to secure endpoints by verifying a local API Key.
 * Checks the 'x-local-api-key' header or standard 'authorization' header (Bearer <key>).
 */
export const requireLocalAuth = (req: Request, res: Response, next: NextFunction) => {
  const headerApiKey = req.headers['x-local-api-key'];
  const authHeader = req.headers['authorization'];

  let clientKey = '';

  if (typeof headerApiKey === 'string') {
    clientKey = headerApiKey;
  } else if (authHeader && typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
    clientKey = authHeader.substring(7);
  }

  if (!clientKey) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Local API security key is missing. Please provide it in the X-Local-API-Key header or as a Bearer Token.',
    });
    return;
  }

  if (clientKey !== env.LOCAL_API_KEY) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid local API security key.',
    });
    return;
  }

  next();
};
