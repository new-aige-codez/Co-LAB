/**
 * Health Check API Route
 *
 * GET: Returns server health status
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: 'MB',
    },
    version: process.env.npm_package_version || '0.9.0',
    environment: process.env.NODE_ENV || 'development',
  };

  return NextResponse.json(health);
}
