import { NextResponse } from 'next/server';

// PocketBase health check — tests DB connectivity
// Used by UptimeRobot to monitor uptime every 5 minutes
// URL: /api/health

export async function GET() {
  const startTime = Date.now();

  try {
    const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';

    // Ping PocketBase's built-in health endpoint
    const res = await fetch(`${pbUrl}/api/health`, {
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!res.ok) throw new Error(`PocketBase returned ${res.status}`);

    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      latencyMs,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    });

  } catch (err) {
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: err instanceof Error ? err.message : 'unknown',
      latencyMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
