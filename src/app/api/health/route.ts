import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();

  try {
    // Verify database connectivity
    await prisma.$queryRaw`SELECT 1`;

    const responseTimeMs = Date.now() - startTime;

    return NextResponse.json({
      status: 'HEALTHY',
      service: 'erosae-commerce-engine',
      environment: process.env.NODE_ENV || 'production',
      database: 'CONNECTED',
      responseTimeMs,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'UNHEALTHY',
        service: 'erosae-commerce-engine',
        database: 'DISCONNECTED',
        error: 'Database connection check failed.',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
