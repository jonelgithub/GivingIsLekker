import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(8080),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOCAL_API_KEY: z.string().min(1, 'LOCAL_API_KEY is required for securing this API'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
  TARGET_ENV: z.enum(['mock', 'sandbox', 'production']).default('mock'),
  CLIENT_ID: z.string().optional(),
  CLIENT_SECRET: z.string().optional(),
  API_KEY: z.string().optional(),
}).refine((data) => {
  // If we are NOT in mock mode, credentials are required
  if (data.TARGET_ENV !== 'mock') {
    return !!data.CLIENT_ID && !!data.CLIENT_SECRET && !!data.API_KEY;
  }
  return true;
}, {
  message: 'CLIENT_ID, CLIENT_SECRET, and API_KEY are required when TARGET_ENV is sandbox or production.',
  path: ['TARGET_ENV'],
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Environment validation failed:', JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
