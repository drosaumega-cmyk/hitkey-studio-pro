/**
 * CORS middleware
 */

import { Context, Next } from 'hono';

export async function corsMiddleware(c: Context, next: Next) {
  const origin = c.req.header('Origin');
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:3000',
    'https://aiaudiostudio.pro',
    'https://www.aiaudiostudio.pro',
  ];

  // Set CORS headers
  c.header('Access-Control-Allow-Origin', allowedOrigins.includes(origin || '') ? origin : allowedOrigins[0]);
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  c.header('Access-Control-Allow-Credentials', 'true');
  c.header('Access-Control-Max-Age', '86400');

  // Handle preflight requests
  if (c.req.method === 'OPTIONS') {
    c.text('', 200);
    return;
  }
  
  return;

  await next();
}