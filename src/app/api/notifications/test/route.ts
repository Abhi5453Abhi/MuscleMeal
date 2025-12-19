// Test endpoint to check notification system status
import { NextResponse } from 'next/server';
import { getConnectionCount } from '@/lib/notifications';
import { getNowISTISO } from '@/lib/utils';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

export async function GET() {
    const connectionCount = getConnectionCount();
    return NextResponse.json({
        activeConnections: connectionCount,
        status: connectionCount > 0 ? 'active' : 'no connections',
        timestamp: getNowISTISO()
    });
}

