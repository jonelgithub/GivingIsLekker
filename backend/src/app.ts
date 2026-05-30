import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import path from 'path';

import { env } from './config/env';
import { requestLogger } from './middleware/logging';
import { errorHandler } from './middleware/error';
import apiRouter from './routes';
import swaggerDocument from './swagger/swagger.json';

const app = express();

// ==========================================
// SECURITY MIDDLEWARES
// ==========================================

// 1. helmet for securing HTTP headers
app.use(helmet());

// 2. CORS configuration with origin filtering
const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or swagger-ui loading from same server)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1 || env.NODE_ENV === 'development') {
        return callback(null, true);
      } else {
        return callback(new Error('Blocked by CORS policy: Origin unauthorized.'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Local-API-Key'],
    credentials: true,
  })
);

// 3. Rate limiting to prevent brute force and DOS attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TooManyRequests',
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});
app.use(limiter);

// 4. Request payload body parsing with size restriction
app.use(express.json({ limit: '10kb' }));

// 5. Request logging
app.use(requestLogger);

// ==========================================
// DOCUMENTATION & LANDING PAGE
// ==========================================

// Serve Swagger Interactive Documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Home Page: Interactive developer landing page
app.get('/', (req, res) => {
  const isMock = env.TARGET_ENV === 'mock' || !env.CLIENT_ID;
  const modeText = isMock
    ? '<span style="color:#d97706; font-weight:bold;">MOCK MODE (Stateful In-Memory)</span>'
    : `<span style="color:#16a34a; font-weight:bold;">LIVE INTERFACE (${env.TARGET_ENV.toUpperCase()})</span>`;

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>API Proxy</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          background: #f3f4f6;
          margin: 0;
          padding: 40px 20px;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: #ffffff;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        h1 {
          color: #111827;
          margin-top: 0;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 20px;
        }
        .status-badge {
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .btn {
          display: inline-block;
          background: #000000;
          color: #ffffff;
          padding: 12px 24px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
          transition: background-color 0.2s;
        }
        .btn:hover {
          background: #1f2937;
        }
        code {
          background: #f3f4f6;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: Consolas, Monaco, monospace;
        }
        pre {
          background: #1f2937;
          color: #f9fafb;
          padding: 15px;
          border-radius: 8px;
          overflow-x: auto;
        }
        .warning-box {
          background: #fef3c7;
          border-left: 4px solid #d97706;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>API Proxy Service</h1>
        <p>This service acts as a secure proxy to integrate your frontend client application with the downstream banking API endpoints.</p>
        
        <div class="status-badge">
          <div>
            <strong>Status:</strong> <span style="color:#16a34a; font-weight:bold;">Online</span><br>
            <strong>Active Mode:</strong> ${modeText}
          </div>
          <a href="/docs" class="btn">View API Documentation</a>
        </div>

        <h2>Security Directives</h2>
        <div class="warning-box">
          <strong>Important:</strong> Client requests require an API key to access proxy routes.
        </div>
        <p>Include the authorization key in request headers using either:</p>
        <ul>
          <li><code>X-Local-API-Key: ${env.LOCAL_API_KEY}</code></li>
          <li><code>Authorization: Bearer ${env.LOCAL_API_KEY}</code></li>
        </ul>

        <h2>Integration Example</h2>
        <p>Query proxy endpoints from your frontend application:</p>
        <pre><code>fetch('http://localhost:${env.PORT}/api/pb/accounts', {
  headers: {
    'X-Local-API-Key': '${env.LOCAL_API_KEY}'
  }
})
.then(res => res.json())
.then(data => console.log(data));</code></pre>
      </div>
    </body>
    </html>
  `);
});

// ==========================================
// ROUTES & ERROR HANDLING
// ==========================================

// Register API router under /api
app.use('/api', apiRouter);

// Fallback 404 Route
app.use((req, res) => {
  res.status(404).json({
    error: 'NotFound',
    message: `Resource ${req.method} ${req.originalUrl} not found.`,
  });
});

// Error handling middleware
app.use(errorHandler);

// ==========================================
// INITIALIZE SERVER
// ==========================================

const server = app.listen(env.PORT, () => {
  console.log(`==================================================`);
  console.log(`API Proxy Server listening on port ${env.PORT}`);
  console.log(`API Documentation: http://localhost:${env.PORT}/docs`);
  console.log(`Target Environment: ${env.TARGET_ENV.toUpperCase()}`);
  console.log(`Local Security Key: ${env.LOCAL_API_KEY}`);
  console.log(`==================================================`);
});

export default app;
